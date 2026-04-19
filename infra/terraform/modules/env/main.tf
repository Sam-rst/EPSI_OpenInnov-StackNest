terraform {
  required_version = ">= 1.6"

  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.0"
    }
  }
}

locals {
  labels = {
    project    = "stacknest"
    env        = var.env_name
    managed_by = "terraform"
  }
}

resource "docker_network" "this" {
  name   = "stacknest-${var.env_name}"
  driver = "bridge"

  dynamic "labels" {
    for_each = local.labels
    content {
      label = labels.key
      value = labels.value
    }
  }
}

resource "docker_volume" "db" {
  name = "stacknest-${var.env_name}-db"

  dynamic "labels" {
    for_each = local.labels
    content {
      label = labels.key
      value = labels.value
    }
  }

  lifecycle {
    prevent_destroy = true
  }
}

resource "docker_volume" "redis" {
  name = "stacknest-${var.env_name}-redis"

  dynamic "labels" {
    for_each = local.labels
    content {
      label = labels.key
      value = labels.value
    }
  }

  lifecycle {
    prevent_destroy = true
  }
}
