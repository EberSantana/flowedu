#!/usr/bin/env bash
# Auto-respond to drizzle-kit generate prompts
cd /home/ubuntu/teacher_schedule_system

# Use unbuffer/expect to handle interactive prompts
# For each prompt, press Enter to accept default (create table)
expect -c '
set timeout 120
spawn npx drizzle-kit generate
while {1} {
  expect {
    "create table" { send "\r"; exp_continue }
    "create column" { send "\r"; exp_continue }
    eof { break }
    timeout { break }
  }
}
'
