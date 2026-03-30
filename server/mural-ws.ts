/**
 * Servidor WebSocket para o Mural Colaborativo em Tempo Real
 * Gerencia conexões, presença de usuários e sincronização de eventos
 */
import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage } from "http";
import { Server } from "http";
import jwt from "jsonwebtoken";
import { ENV } from "./_core/env";

// ── Tipos de mensagens WebSocket ──────────────────────────────────────────────
export type WsMessageType =
  | "join"           // entrar no mural
  | "leave"          // sair do mural
  | "card_added"     // novo card criado
  | "card_updated"   // card editado (texto, coluna, resposta)
  | "card_deleted"   // card removido
  | "vote_toggled"   // voto adicionado/removido
  | "mural_locked"   // professor bloqueou edição
  | "mural_unlocked" // professor desbloqueou edição
  | "cursor_move"    // movimento do cursor (opcional, baixa prioridade)
  | "presence"       // lista de usuários online
  | "error";

export interface WsMessage {
  type: WsMessageType;
  muralId: number;
  payload?: any;
  userId?: number;
  studentId?: number;
  userName?: string;
  userType?: "teacher" | "student";
  timestamp?: number;
}

// ── Estrutura de sessão de usuário conectado ──────────────────────────────────
interface ConnectedUser {
  ws: WebSocket;
  muralId: number;
  userId?: number;
  studentId?: number;
  userName: string;
  userType: "teacher" | "student";
  connectedAt: number;
}

// ── Mapa de conexões: muralId → lista de usuários ─────────────────────────────
const muralRooms = new Map<number, Set<ConnectedUser>>();

/**
 * Inicializa o servidor WebSocket no servidor HTTP existente
 */
export function initMuralWebSocket(server: Server): WebSocketServer {
  const wss = new WebSocketServer({ server, path: "/ws/mural" });

  wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
    let currentUser: ConnectedUser | null = null;

    // Autenticar usuário via cookie ou query param token
    const userInfo = authenticateWsUser(req);
    if (!userInfo) {
      ws.send(JSON.stringify({ type: "error", payload: { message: "Não autenticado" } }));
      ws.close(1008, "Unauthorized");
      return;
    }

    ws.on("message", (data: Buffer) => {
      try {
        const msg: WsMessage = JSON.parse(data.toString());

        if (msg.type === "join") {
          // Registrar usuário na sala do mural
          const muralId = Number(msg.muralId);
          if (!muralId) return;

          currentUser = {
            ws,
            muralId,
            userId: userInfo.userId,
            studentId: userInfo.studentId,
            userName: userInfo.name,
            userType: userInfo.type,
            connectedAt: Date.now(),
          };

          // Adicionar à sala
          if (!muralRooms.has(muralId)) {
            muralRooms.set(muralId, new Set());
          }
          muralRooms.get(muralId)!.add(currentUser);

          // Notificar todos na sala sobre a nova presença
          broadcastPresence(muralId);
          console.log(`[MuralWS] ${userInfo.name} entrou no mural ${muralId}`);
          return;
        }

        if (!currentUser) return;

        // Repassar evento para todos os outros usuários da mesma sala
        const { muralId } = currentUser;
        const outMsg: WsMessage = {
          ...msg,
          userId: currentUser.userId,
          studentId: currentUser.studentId,
          userName: currentUser.userName,
          userType: currentUser.userType,
          timestamp: Date.now(),
        };

        broadcastToRoom(muralId, outMsg, ws);

      } catch (err) {
        console.error("[MuralWS] Erro ao processar mensagem:", err);
      }
    });

    ws.on("close", () => {
      if (!currentUser) return;
      const { muralId } = currentUser;
      const room = muralRooms.get(muralId);
      if (room) {
        room.delete(currentUser);
        if (room.size === 0) {
          muralRooms.delete(muralId);
        } else {
          broadcastPresence(muralId);
        }
      }
      console.log(`[MuralWS] ${currentUser.userName} saiu do mural ${muralId}`);
    });

    ws.on("error", (err: Error) => {
      console.error("[MuralWS] Erro WebSocket:", err.message);
    });
  });

  console.log("[MuralWS] Servidor WebSocket inicializado em /ws/mural");
  return wss;
}

/**
 * Envia mensagem para todos na sala, exceto o remetente
 */
function broadcastToRoom(muralId: number, msg: WsMessage, senderWs?: WebSocket) {
  const room = muralRooms.get(muralId);
  if (!room) return;
  const data = JSON.stringify(msg);
  Array.from(room).forEach((user) => {
    if (user.ws !== senderWs && user.ws.readyState === WebSocket.OPEN) {
      user.ws.send(data);
    }
  });
}

/**
 * Envia lista de presença para todos na sala (incluindo o próprio usuário)
 */
function broadcastPresence(muralId: number) {
  const room = muralRooms.get(muralId);
  if (!room) return;
  const users = (Array.from(room) as ConnectedUser[]).map((u) => ({
    userId: u.userId,
    studentId: u.studentId,
    userName: u.userName,
    userType: u.userType,
    connectedAt: u.connectedAt,
  }));
  const msg: WsMessage = {
    type: "presence",
    muralId,
    payload: { users },
    timestamp: Date.now(),
  };
  const data = JSON.stringify(msg);
  Array.from(room).forEach((user) => {
    if ((user as ConnectedUser).ws.readyState === WebSocket.OPEN) {
      (user as ConnectedUser).ws.send(data);
    }
  });
}

/**
 * Broadcast público — usado pelo tRPC para notificar eventos de banco de dados
 */
export function broadcastMuralEvent(muralId: number, msg: WsMessage) {
  broadcastToRoom(muralId, msg);
}

// ── Autenticação ──────────────────────────────────────────────────────────────
interface WsUserInfo {
  userId?: number;
  studentId?: number;
  name: string;
  type: "teacher" | "student";
}

function authenticateWsUser(req: IncomingMessage): WsUserInfo | null {
  try {
    // Tentar extrair token da query string: /ws/mural?token=xxx&type=teacher
    const url = new URL(req.url || "", "http://localhost");
    const token = url.searchParams.get("token");
    const userType = url.searchParams.get("type") as "teacher" | "student" | null;

    if (!token || !userType) return null;

    const decoded = jwt.verify(token, ENV.cookieSecret) as any;

    if (userType === "teacher") {
      return {
        userId: decoded.userId || decoded.id,
        name: decoded.name || decoded.email || "Professor",
        type: "teacher",
      };
    } else {
      return {
        studentId: decoded.studentId || decoded.id,
        name: decoded.name || decoded.matricula || "Aluno",
        type: "student",
      };
    }
  } catch {
    return null;
  }
}

/**
 * Retorna usuários online em um mural específico
 */
export function getMuralOnlineUsers(muralId: number) {
  const room = muralRooms.get(muralId);
  if (!room) return [];
  return Array.from(room).map((u) => ({
    userId: u.userId,
    studentId: u.studentId,
    userName: u.userName,
    userType: u.userType,
  }));
}
