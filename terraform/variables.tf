variable "cloudflare_zone_id" {
 type      = string
 sensitive = true
}

variable "public_key_path" {
 type    = string
 default = "~/.ssh/id_rsa.pub"
}

# outputs.tf
output "public_ip" {
 value = aws_instance.app.public_ip
}

output "cloudflare_url" {
 value = cloudflare_record.app.hostname
}