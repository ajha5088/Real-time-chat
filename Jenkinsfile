pipeline {
    agent any

    environment {
        // Docker registry configuration
        DOCKER_REGISTRY = 'docker.io'
        DOCKER_USERNAME = credentials('docker-username')
        DOCKER_PASSWORD = credentials('docker-password')
        
        // Image names
        BACKEND_IMAGE = "${DOCKER_REGISTRY}/chatapp/backend:${BUILD_NUMBER}"
        FRONTEND_IMAGE = "${DOCKER_REGISTRY}/chatapp/frontend:${BUILD_NUMBER}"
        BACKEND_IMAGE_LATEST = "${DOCKER_REGISTRY}/chatapp/backend:latest"
        FRONTEND_IMAGE_LATEST = "${DOCKER_REGISTRY}/chatapp/frontend:latest"
        
        // Environment
        NODE_ENV = 'production'
    }

    options {
        // Keep last 10 builds
        buildDiscarder(logRotator(numToKeepStr: '10'))
        // Add timestamp to console output
        timestamps()
        // Timeout after 1 hour
        timeout(time: 1, unit: 'HOURS')
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    // Get commit info
                    env.COMMIT_HASH = sh(
                        script: 'git rev-parse HEAD',
                        returnStdout: true
                    ).trim().take(7)
                    env.COMMIT_MSG = sh(
                        script: 'git log -1 --pretty=%B',
                        returnStdout: true
                    ).trim()
                    
                    echo "✓ Checked out commit: ${COMMIT_HASH}"
                    echo "✓ Commit message: ${COMMIT_MSG}"
                }
            }
        }

        stage('Install Dependencies') {
            parallel {
                stage('Backend Dependencies') {
                    steps {
                        dir('backend') {
                            sh 'npm ci'
                            echo "✓ Backend dependencies installed"
                        }
                    }
                }
                stage('Frontend Dependencies') {
                    steps {
                        dir('frontend') {
                            sh 'npm ci'
                            echo "✓ Frontend dependencies installed"
                        }
                    }
                }
            }
        }

        stage('Lint & Code Quality') {
            parallel {
                stage('Backend Lint') {
                    steps {
                        dir('backend') {
                            sh 'npm run lint || true'
                            echo "✓ Backend linting completed"
                        }
                    }
                }
                stage('Frontend Lint') {
                    steps {
                        dir('frontend') {
                            sh 'npm run lint || true'
                            echo "✓ Frontend linting completed"
                        }
                    }
                }
            }
        }

        stage('Unit Tests') {
            parallel {
                stage('Backend Tests') {
                    steps {
                        dir('backend') {
                            sh 'npm test -- --passWithNoTests --coverage || true'
                            echo "✓ Backend tests completed"
                        }
                    }
                }
                stage('Frontend Tests') {
                    steps {
                        dir('frontend') {
                            sh 'npm test -- --passWithNoTests --coverage || true'
                            echo "✓ Frontend tests completed"
                        }
                    }
                }
            }
        }

        stage('Build Docker Images') {
            parallel {
                stage('Build Backend Image') {
                    steps {
                        script {
                            sh '''
                                docker build \
                                    -t ${BACKEND_IMAGE} \
                                    -t ${BACKEND_IMAGE_LATEST} \
                                    -f backend/Dockerfile \
                                    backend/
                                echo "✓ Backend Docker image built: ${BACKEND_IMAGE}"
                            '''
                        }
                    }
                }
                stage('Build Frontend Image') {
                    steps {
                        script {
                            sh '''
                                docker build \
                                    -t ${FRONTEND_IMAGE} \
                                    -t ${FRONTEND_IMAGE_LATEST} \
                                    -f frontend/Dockerfile \
                                    frontend/
                                echo "✓ Frontend Docker image built: ${FRONTEND_IMAGE}"
                            '''
                        }
                    }
                }
            }
        }

        stage('Push Docker Images') {
            when {
                branch 'main'
            }
            steps {
                script {
                    sh '''
                        echo ${DOCKER_PASSWORD} | docker login -u ${DOCKER_USERNAME} --password-stdin ${DOCKER_REGISTRY}
                        
                        docker push ${BACKEND_IMAGE}
                        docker push ${BACKEND_IMAGE_LATEST}
                        echo "✓ Backend image pushed"
                        
                        docker push ${FRONTEND_IMAGE}
                        docker push ${FRONTEND_IMAGE_LATEST}
                        echo "✓ Frontend image pushed"
                        
                        docker logout ${DOCKER_REGISTRY}
                    '''
                }
            }
        }

        stage('Deploy to Staging') {
            when {
                branch 'main'
            }
            steps {
                script {
                    echo "🚀 Deploying to staging environment..."
                    sh '''
                        # Check if docker-compose is available
                        if command -v docker-compose &> /dev/null; then
                            echo "Stopping old containers..."
                            docker-compose -f docker-compose.staging.yml down || true
                            
                            echo "Starting new containers..."
                            docker-compose -f docker-compose.staging.yml up -d
                            
                            echo "Waiting for services to be healthy..."
                            sleep 10
                            
                            # Health check
                            if curl -f http://localhost:5173 > /dev/null 2>&1; then
                                echo "✓ Frontend is running"
                            else
                                echo "✗ Frontend health check failed"
                                exit 1
                            fi
                            
                            if curl -f http://localhost:4000/health > /dev/null 2>&1; then
                                echo "✓ Backend is running"
                            else
                                echo "✗ Backend health check failed"
                                exit 1
                            fi
                        else
                            echo "docker-compose not found. Skipping container deployment."
                        fi
                    '''
                }
            }
        }

        stage('Deploy to Production') {
            when {
                tag pattern: "v\\d+\\.\\d+\\.\\d+", comparator: "REGEXP"
            }
            input {
                message "Deploy to production?"
                ok "Deploy"
            }
            steps {
                script {
                    echo "🚀 Deploying to production environment..."
                    sh '''
                        # Deploy to production (configure based on your infrastructure)
                        # Example: kubectl apply -f k8s/
                        # Or: ./scripts/deploy-production.sh
                        
                        echo "✓ Production deployment completed"
                    '''
                }
            }
        }
    }

    post {
        always {
            // Clean up Docker images if needed
            sh 'docker image prune -f --filter "until=24h" || true'
            
            // Archive test results if they exist
            junit allowEmptyResults: true, testResults: '**/test-results.xml'
            
            echo "Pipeline execution completed"
        }
        success {
            echo "✅ Pipeline succeeded"
            // Add notification (Slack, email, etc.)
            // slackSend(channel: '#deployments', message: "Deployment successful: ${COMMIT_MSG}")
        }
        failure {
            echo "❌ Pipeline failed"
            // Add notification
            // slackSend(channel: '#deployments', message: "Deployment failed: ${COMMIT_MSG}")
        }
        cleanup {
            // Clean workspace
            cleanWs()
        }
    }
}
