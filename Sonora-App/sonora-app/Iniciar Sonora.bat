@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ========================================
echo          SONORA - PLAYER MUSICAL
echo ========================================
echo.
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js nao foi encontrado.
  echo Instale a versao LTS em https://nodejs.org/ e execute este arquivo novamente.
  echo.
  pause
  exit /b 1
)
if not exist "node_modules" (
  echo Instalando as dependencias pela primeira vez...
  call npm install
  if errorlevel 1 (
    echo.
    echo Nao foi possivel instalar as dependencias. Confira a conexao e tente npm install manualmente.
    pause
    exit /b 1
  )
)
echo.
echo Abrindo o Sonora. Quando o terminal mostrar o endereco local, abra-o no navegador.
echo Para encerrar o app, pressione Ctrl+C nesta janela.
echo.
call npm run dev
pause
