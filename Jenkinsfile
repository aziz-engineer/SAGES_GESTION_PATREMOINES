pipeline {
agent any
    

    environment {
                PATH = "${env.PATH}:/home/vagrant/sonar-scanner-cli/sonar-scanner-4.6.2.2472-linux/bin"

       
        NODEJS_VERSION = 'nodejs-lts' // Define NodeJS version
        COMPOSER_HOME = './.composer' // Define Composer home directory
        SONARQUBE_ENV = 'laravel-react-survey-main'
        DOCKER_USERNAME = 'yassine987'
        DOCKER_PASSWORD = 'azerty123'
         DOCKER_HUB_REPOSITORY = 'yassine987'  // Assurez-vous de mettre votre nom de dépôt correct



         // Laravel environment variables
        APP_NAME = 'Laravel'
        APP_ENV = 'local'
        APP_KEY = 'base64:4P8KiJpS77dmjoVBqvYmXma13F43BcIqQdh4T05YaHk='
        APP_DEBUG = 'true'
        APP_URL = 'http://localhost'
        DB_CONNECTION = 'mysql'
        DB_HOST = 'host.docker.internal'
        DB_PORT = '3306'
        DB_DATABASE = 'pfeversion004'
        DB_USERNAME = 'root'
        DB_PASSWORD = ''
        MAIL_MAILER = 'smtp'
        MAIL_HOST = 'sandbox.smtp.mailtrap.io'
        MAIL_PORT = '2525'
        MAIL_USERNAME = '323cc5c83ecf30'
        MAIL_PASSWORD = 'cec68743f42d98'
        MAIL_ENCRYPTION = 'tls'
        MAIL_FROM_ADDRESS = 'yassine.kochkache@esprit.tn'
        MAIL_FROM_NAME = 'Laravel'
    }
    



       


    stages {
         stage('Checkout') {
            steps {
                git url: "https://github.com/yassine-kochkache/PfeV4.git", branch: 'main'
            }
        }
       
        
               stage("GIT") {
     steps {
       sh 'git checkout main'
       sh 'git pull origin main'
      }
    }
    stage('Build Laravel') {
            steps {
                    script {
                        sh 'composer install'
                        // Additional build steps if needed
                    
                }
            }
        }
   
    stage('Build React') {
            steps {
                dir('react') {
                    script {
                        sh 'npm install'
                    }
                }
            }
        }
        stage('Prepare SonarQube') {
            steps {
                script {
                    // Change ownership and permissions without requiring password
                    sh 'sudo chown -R jenkins:jenkins /home/vagrant/sonar-scanner-cli'
                    sh 'sudo chmod -R 755 /home/vagrant/sonar-scanner-cli'
                }
            }
        }

       stage('SonarQube Analysis') {
    steps {
        withSonarQubeEnv('laravel-react-survey-main') { // Nom de votre configuration SonarQube
            sh '''
                sonar-scanner \
                    -Dsonar.projectKey=sonartesttest \
                    -Dsonar.sources=. \
                    -Dsonar.host.url=http://192.168.56.2:9000 \
                    -Dsonar.login=sqp_c20fdc4389adf1a4c90e75b11188887d7b0daab8
                    
            '''
        }
    }
}



/*stage('Docker Login') {
            steps {
                script {
                    sh "docker login -u ${DOCKER_USERNAME} -p ${DOCKER_PASSWORD}"
                }
            }
        }

         stage('Docker Build and Push') {
            steps {
                script {
                    // Build Laravel backend container
                    sh 'docker-compose -f docker-compose.yml build laravel-app'
                    
                    // Build React frontend container
                    sh 'docker-compose -f docker-compose.yml build frontend'
                    
                   
                }
            }
        }

         stage('Clean Up Existing Containers') {
            steps {
                script {
                    sh 'docker rm -f laravel-app || true'
                    sh 'docker rm -f react-app || true'
                }
            }
        }

        stage('Docker Compose Up') {
            steps {
                script {
                    // Start Laravel and React containers
                    sh 'docker-compose -f docker-compose.yml up -d'
                }
            }
        }


        
  */
          
        
    }
    
}