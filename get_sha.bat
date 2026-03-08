echo Searching for keytool.exe (this might take a moment)...
for /f "delims=" %%F in ('where /r "C:\Program Files" keytool.exe 2^>nul') do set KEYTOOL="%%F" && goto :FOUND
for /f "delims=" %%F in ('where /r "%LOCALAPPDATA%" keytool.exe 2^>nul') do set KEYTOOL="%%F" && goto :FOUND
for /f "delims=" %%F in ('where /r "%USERPROFILE%" keytool.exe 2^>nul') do set KEYTOOL="%%F" && goto :FOUND

if %KEYTOOL% == "" (
  echo Could not find keytool.exe.
  pause
  exit /b
)

:FOUND

echo Found keytool at %KEYTOOL%
echo Extracting SHA-256 fingerprint...
echo.

%KEYTOOL% -list -v -keystore "%USERPROFILE%\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android | findstr "SHA256"

echo.
pause
