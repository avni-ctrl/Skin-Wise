@echo off
rem Dev-server wrapper: ensures Node (installed at the default location) is on
rem PATH even in shells opened before the install.
set "PATH=C:\Program Files\nodejs;%PATH%"
node node_modules\vite\bin\vite.js %*
