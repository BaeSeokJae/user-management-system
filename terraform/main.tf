# main.tf
resource "aws_vpc" "main" {
 cidr_block           = "10.0.0.0/16"
 enable_dns_hostnames = true
 enable_dns_support   = true

 tags = {
   Name = "main"
 }
}

resource "aws_subnet" "public" {
 vpc_id                  = aws_vpc.main.id
 cidr_block              = "10.0.1.0/24"
 map_public_ip_on_launch = true
 availability_zone       = "${var.aws_region}a"

 tags = {
   Name = "public"
 }
}

resource "aws_internet_gateway" "main" {
 vpc_id = aws_vpc.main.id
}

resource "aws_route_table" "public" {
 vpc_id = aws_vpc.main.id

 route {
   cidr_block = "0.0.0.0/0"
   gateway_id = aws_internet_gateway.main.id
 }
}

resource "aws_route_table_association" "public" {
 subnet_id      = aws_subnet.public.id
 route_table_id = aws_route_table.public.id
}

resource "aws_security_group" "app" {
 name   = "app"
 vpc_id = aws_vpc.main.id

 ingress {
   from_port   = 80
   to_port     = 80
   protocol    = "tcp"
   cidr_blocks = ["0.0.0.0/0"]
 }

 ingress {
   from_port   = 443
   to_port     = 443
   protocol    = "tcp"  
   cidr_blocks = ["0.0.0.0/0"]
 }

 ingress {
   from_port   = 22
   to_port     = 22
   protocol    = "tcp"
   cidr_blocks = ["0.0.0.0/0"]
 }

 egress {
   from_port   = 0
   to_port     = 0
   protocol    = "-1"
   cidr_blocks = ["0.0.0.0/0"]
 }
}

resource "aws_instance" "app" {
 ami                    = "ami-0c9c942bd7bf113a2"  # Amazon Linux 2023
 instance_type          = var.instance_type
 subnet_id              = aws_subnet.public.id
 vpc_security_group_ids = [aws_security_group.app.id]
 key_name              = aws_key_pair.deployer.key_name

 user_data = <<-EOF
             #!/bin/bash
             yum update -y
             yum install -y docker
             systemctl start docker
             systemctl enable docker
             usermod -aG docker ec2-user
             curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
             chmod +x /usr/local/bin/docker-compose
             EOF
}

resource "aws_key_pair" "deployer" {
 key_name   = "deployer-key"
 public_key = file(var.public_key_path)
}

# Cloudflare DNS 설정
resource "cloudflare_record" "app" {
 zone_id = var.cloudflare_zone_id
 name    = var.domain_name
 value   = aws_instance.app.public_ip
 type    = "A"
 proxied = true
}

resource "null_resource" "deploy" {
  depends_on = [aws_instance.app]

  provisioner "remote-exec" {
    inline = [
      "mkdir -p /home/ec2-user/app"
    ]

    connection {
      type        = "ssh"
      user        = "ec2-user"
      private_key = file("~/.ssh/id_rsa")
      host        = aws_instance.app.public_ip
    }
  }
}