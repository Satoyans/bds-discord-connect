@echo off
echo %%1: %1
echo %%2: %2
echo %%3: %3
echo %%4: %4
set empty=False
if '%1'=='' set empty= True
if '%2'=='' set empty= True
if '%3'=='' set empty= True
if '%4'=='' set empty= True
if %empty%==True   (
  echo from_dir or at_dir or timestamp empty
  pause
  exit /b
)
set from_dir=%1
set at_dir=%2
set timestamp=%3
set max_file_num=%4

robocopy %from_dir% %at_dir%\BACKUP%timestamp% /s /e /ipg:5

for /f "skip=%max_file_num%" %%a in ('dir /b /o:-n %at_dir%\BACKUP*') do (
  del /f /s /q %at_dir%\%%a > nul
  rd /s /q %at_dir%\%%a
)
exit 0