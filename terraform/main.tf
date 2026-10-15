terraform {
  required_version = ">= 1.5.0"
  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.29"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.13"
    }
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.48"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# S3 Bucket for MLflow Artifacts & Model Store
resource "aws_s3_bucket" "model_store" {
  bucket = "${var.environment}-enterprise-model-store-${var.aws_region}"

  tags = {
    Environment = var.environment
    ManagedBy   = "Terraform"
    Project     = "enterprise-mlops-platform"
  }
}

# KServe Helm Release
resource "helm_release" "kserve" {
  name             = "kserve"
  repository       = "https://kserve.github.io/charts"
  chart            = "kserve"
  version          = "v0.13.0"
  namespace        = "kserve"
  create_namespace = true

  set {
    name  = "kserve.modelmesh.enabled"
    value = "false"
  }
}

# KubeRay Operator Release
resource "helm_release" "kuberay_operator" {
  name             = "kuberay-operator"
  repository       = "https://ray-project.github.io/kuberay-helm/"
  chart            = "kuberay-operator"
  version          = "1.1.0"
  namespace        = "kuberay-system"
  create_namespace = true
}
