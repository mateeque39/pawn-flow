@echo off
cd /d "c:\Users\HP\pawn-flow"
node test-minimal-server.js 2>&1 | tee server-test.log
pause
