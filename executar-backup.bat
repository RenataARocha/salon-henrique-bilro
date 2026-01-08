@echo off
:: ============================================
:: EXECUTAR BACKUP MANUALMENTE - SALON BILRO
:: ============================================

title Salon Bilro - Backup Manual

echo.
echo ╔════════════════════════════════════════════╗
echo ║       BACKUP MANUAL - SALON BILRO          ║
echo ╚════════════════════════════════════════════╝
echo.

:: Verificar se Node.js está instalado
where node >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ ERRO: Node.js não encontrado!
    echo.
    echo Por favor, instale o Node.js:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo 🔄 Iniciando backup...
echo.

:: Executar script de backup
node scripts\backup.js

echo.
echo ═════════════════════════════════════════════
echo.

if %errorLevel% equ 0 (
    echo ✅ BACKUP CONCLUÍDO COM SUCESSO!
    echo.
    echo 📁 Local dos backups:
    echo    C:\MeusBACKUPS\salon-bilro\
    echo.
    echo 💡 Dica: Verifique se os arquivos foram criados
) else (
    echo ❌ Erro ao executar backup
    echo.
    echo Verifique:
    echo - Node.js está instalado?
    echo - Arquivo scripts\backup.js existe?
    echo - Você está na pasta correta do projeto?
)

echo.
echo ═════════════════════════════════════════════
echo.
pause