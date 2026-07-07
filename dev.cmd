@echo off
rem Dev-server wrapper: uses the absolute Node path so it works even in
rem shells/processes that predate the Node install (stale PATH).
set "PATH=C:\Program Files\nodejs;%PATH%"
"C:\Program Files\nodejs\node.exe" "%~dp0node_modules\vite\bin\vite.js" %*
