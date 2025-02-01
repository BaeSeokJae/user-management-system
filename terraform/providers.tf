# providers.tf
terraform {
 required_providers {
   aws = {
     source  = "hashicorp/aws"
     version = "~> 5.0"
   }
   cloudflare = {
     source  = "cloudflare/cloudflare"
     version = "~> 4.0"
   }
 }
}

provider "aws" {
 region = var.aws_region
}

provider "cloudflare" {
 api_token = var.cloudflare_token
}

# variables.tf
variable "aws_region" {
 type    = string
 default = "ap-northeast-2"
}

variable "cloudflare_token" {
 type      = string
 sensitive = true
}

variable "domain_name" {
 type = string
}

variable "instance_type" {
 type    = string
 default = "t2.micro"
}