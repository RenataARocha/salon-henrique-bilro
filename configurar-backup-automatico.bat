@echo off
:: ============================================
:: AGENDADOR DE BACKUP AUTOMÁTICO - WINDOWS
:: Salon Bilro
:: ============================================

echo.
echo ╔════════════════════════════════════════════╗
echo ║  CONFIGURADOR DE BACKUP AUTOMÁTICO         ║
echo ╚════════════════════════════════════════════╝
echo.

:: Verificar se está rodando como Administrador
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ ERRO: Execute como Administrador!
    echo.
    echo Clique com botão direito neste arquivo e selecione
    echo "Executar como administrador"
    echo.
    pause
    exit /b 1
)

echo ✅ Executando como Administrador
echo.

:: Perguntar ao usuário
echo Escolha a frequência do backup:
echo.
echo 1. DIÁRIO (Todo dia às 9h)
echo 2. SEMANAL (Toda segunda às 9h)
echo 3. MANUAL (Apenas quando executar)
echo.

set /p opcao="Digite o número da opção (1, 2 ou 3): "

if "%opcao%"=="1" goto DIARIO
if "%opcao%"=="2" goto SEMANAL
if "%opcao%"=="3" goto MANUAL
goto ERRO

:DIARIO
echo.
echo 📅 Configurando backup DIÁRIO...
echo.

:: Criar tarefa diária às 9h
schtasks /create /tn "Salon Bilro - Backup Diário" /tr "node %cd%\scripts\backup.js" /sc daily /st 09:00 /f

if %errorLevel% equ 0 (
    echo ✅ Backup diário configurado com sucesso!
    echo 🕐 Executará todo dia às 9h
) else (
    echo ❌ Erro ao configurar backup
)

goto FIM

:SEMANAL
echo.
echo 📅 Configurando backup SEMANAL...
echo.

:: Criar tarefa semanal às segundas 9h
schtasks /create /tn "Salon Bilro - Backup Semanal" /tr "node %cd%\scripts\backup.js" /sc weekly /d MON /st 09:00 /f

if %errorLevel% equ 0 (
    echo ✅ Backup semanal configurado com sucesso!
    echo 🕐 Executará toda segunda às 9h
) else (
    echo ❌ Erro ao configurar backup
)

goto FIM

:MANUAL
echo.
echo 📝 Modo manual selecionado
echo.
echo Para fazer backup, execute:
echo   npm run backup
echo.
echo Ou clique em: executar-backup.bat
echo.
goto FIM

:ERRO
echo.
echo ❌ Opção inválida!
echo.
pause
exit /b 1

:FIM
echo.
echo ═════════════════════════════════════════════
echo.
echo 💡 COMANDOS ÚTEIS:
echo.
echo Testar backup agora:
echo   npm run backup
echo.
echo Ver tarefas agendadas:
echo   schtasks /query /tn "Salon Bilro*"
echo.
echo Remover agendamento:
echo   schtasks /delete /tn "Salon Bilro - Backup Diário" /f
echo.
echo ═════════════════════════════════════════════
echo.
pause