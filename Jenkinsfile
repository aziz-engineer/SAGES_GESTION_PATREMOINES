pipeline {
    agent any

    stages {
        stage('Build Laravel dependencies') {
            steps {
                sh 'composer install --no-interaction --prefer-dist'
            }
        }

        stage('Build React frontend') {
            steps {
                dir('react') {
                    sh 'npm ci'
                    sh 'npm run build'
                }
            }
        }
    }
}
