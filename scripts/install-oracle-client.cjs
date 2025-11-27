const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('Oracle Instant Client kurulumu başlatılıyor...');

try {
    // Platform kontrolü
    const platform = os.platform();
    console.log('Platform:', platform);
    
    if (platform === 'win32') {
        console.log('Windows için Oracle Instant Client kurulumu...');
        
        // Windows için Oracle Instant Client kurulumu
        const oracleClientPath = path.join(__dirname, 'oracle-instantclient');
        
        if (!fs.existsSync(oracleClientPath)) {
            fs.mkdirSync(oracleClientPath, { recursive: true });
            console.log('Oracle Instant Client klasörü oluşturuldu:', oracleClientPath);
        }
        
        // Oracle Instant Client indirme ve kurulum komutları
        console.log('Oracle Instant Client indiriliyor...');
        
        // PowerShell ile indirme
        const downloadCommand = `
            $url = "https://download.oracle.com/otn_software/nt/instantclient/1923000/instantclient-basic-windows.x64-19.23.0.0.0dbru.zip"
            $output = "${oracleClientPath}\\instantclient.zip"
            Invoke-WebRequest -Uri $url -OutFile $output
            Expand-Archive -Path $output -DestinationPath "${oracleClientPath}" -Force
            Remove-Item $output
        `;
        
        execSync(downloadCommand, { shell: 'powershell' });
        
        console.log('Oracle Instant Client başarıyla kuruldu!');
        console.log('Kurulum yolu:', oracleClientPath);
        
    } else if (platform === 'linux') {
        console.log('Linux için Oracle Instant Client kurulumu...');
        
        // Linux için Oracle Instant Client kurulumu
        const installCommand = `
            cd /tmp
            wget https://download.oracle.com/otn_software/linux/instantclient/1923000/oracle-instantclient19.23-basic-19.23.0.0.0-1.x86_64.rpm
            sudo rpm -ivh oracle-instantclient19.23-basic-19.23.0.0.0-1.x86_64.rpm
            sudo sh -c "echo /usr/lib/oracle/19.23/client64/lib > /etc/ld.so.conf.d/oracle-instantclient.conf"
            sudo ldconfig
        `;
        
        execSync(installCommand, { shell: 'bash' });
        
        console.log('Oracle Instant Client başarıyla kuruldu!');
        
    } else if (platform === 'darwin') {
        console.log('macOS için Oracle Instant Client kurulumu...');
        
        // macOS için Oracle Instant Client kurulumu
        const installCommand = `
            brew install instantclient-basic
        `;
        
        execSync(installCommand, { shell: 'bash' });
        
        console.log('Oracle Instant Client başarıyla kuruldu!');
        
    } else {
        console.error('Desteklenmeyen platform:', platform);
        process.exit(1);
    }
    
    console.log('Oracle Instant Client kurulumu tamamlandı!');
    
} catch (error) {
    console.error('Oracle Instant Client kurulum hatası:', error.message);
    console.log('\nManuel kurulum için:');
    console.log('1. https://www.oracle.com/database/technologies/instant-client.html adresine gidin');
    console.log('2. İşletim sisteminize uygun Oracle Instant Client\'ı indirin');
    console.log('3. Kurulum talimatlarını takip edin');
    process.exit(1);
}
