#!/bin/bash
ssh -i ~/.ssh/id_rsa ec2-user@${public_ip} << 'ENDSSH'
mkdir -p /home/ec2-user/app
cd /home/ec2-user/app
ENDSSH

scp -i ~/.ssh/id_rsa docker-compose.yml ec2-user@${public_ip}:/home/ec2-user/app/
scp -i ~/.ssh/id_rsa Dockerfile ec2-user@${public_ip}:/home/ec2-user/app/
scp -i ~/.ssh/id_rsa .env ec2-user@${public_ip}:/home/ec2-user/app/

ssh -i ~/.ssh/id_rsa ec2-user@${public_ip} << 'ENDSSH'
cd /home/ec2-user/app
docker-compose down
docker-compose up -d --build
ENDSSH