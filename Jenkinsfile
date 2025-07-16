pipeline {
    agent any
    stages {
        // 1. 从GitHub拉取代码
        stage('Checkout') {
            steps {
                git url: 'https://github.com/lwyx2000/koodo-reader.git',  
                     branch: 'dev',  // 修改分支为 dev
                     credentialsId: '8695ee47-da56-48c6-845e-0631ba4db951'  
            }
        }

        // 2. 部署静态文件
        stage('Deploy to Nginx') {
            steps {
                script {
                    sshagent(['ssh-credential-id']) {  // 使用 SSH 凭证 ID
                        sh """
                            ssh sos@192.168.3.53 "mkdir -p /home/sos/apps/koodo-reader"
                            ssh sos@192.168.3.53 "rm -rf /home/sos/apps/koodo-reader/*"
                            scp -r public/* sos@192.168.3.53:/home/sos/apps/koodo-reader/
                            ssh sos@192.168.3.53 "sudo systemctl reload nginx"
                        """
                    }
                }
            }
        }
    }
}