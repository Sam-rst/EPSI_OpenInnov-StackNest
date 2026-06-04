import type { CatalogItem } from '../domain/models/CatalogItem';

export const CATALOG_ITEMS: ReadonlyArray<CatalogItem> = [
  { id: 'pg16',   name: 'PostgreSQL 16',     icon: 'database',    category: 'Database',     provider: 'Docker',    tags: ['SQL', 'Persistant'],   desc: 'Base relationnelle managée, backups & replicas.',    popular: true },
  { id: 'redis7', name: 'Redis 7',           icon: 'server',      category: 'Cache',        provider: 'Docker',    tags: ['Cache', 'In-memory'],  desc: 'Store clé-valeur ultra-rapide pour cache & queues.', popular: true },
  { id: 'minio',  name: 'MinIO',             icon: 'hard-drive',  category: 'Storage',      provider: 'Docker',    tags: ['S3', 'Object'],        desc: 'Stockage objet compatible S3 self-hosted.' },
  { id: 'ubuntu', name: 'VM Ubuntu 24.04',   icon: 'monitor',     category: 'Compute',      provider: 'Terraform', tags: ['VM', 'Linux'],         desc: 'Machine virtuelle Ubuntu LTS, SSH ready.',           popular: true },
  { id: 'node',   name: 'Conteneur Node.js', icon: 'box',         category: 'Runtime',      provider: 'Docker',    tags: ['Runtime', 'JS'],       desc: 'Image Node 22 LTS prête à déployer.' },
  { id: 'python', name: 'Conteneur Python',  icon: 'box',         category: 'Runtime',      provider: 'Docker',    tags: ['Runtime', 'Python'],   desc: 'Python 3.12 + venv préconfiguré.' },
  { id: 'vpc',    name: 'Réseau VPC',        icon: 'network',     category: 'Network',      provider: 'Terraform', tags: ['VPC', 'Subnet'],       desc: 'Réseau isolé avec sous-réseaux & routing.' },
  { id: 's3',     name: 'Bucket S3',         icon: 'archive',     category: 'Storage',      provider: 'Terraform', tags: ['S3', 'AWS'],           desc: 'Bucket S3 versionné, IAM scopé.' },
  { id: 'elk',    name: 'Stack ELK',         icon: 'bar-chart-3', category: 'Observabilité', provider: 'Docker',   tags: ['Logs', 'Search'],      desc: 'Elasticsearch + Logstash + Kibana, prêt à indexer.' },
  { id: 'vault',  name: 'Vault',             icon: 'lock',        category: 'Secrets',      provider: 'Docker',    tags: ['Secrets', 'KMS'],      desc: 'Coffre de secrets et rotation de credentials.' },
  { id: 'ollama', name: 'Ollama',            icon: 'sparkles',    category: 'AI',           provider: 'Docker',    tags: ['LLM', 'GPU'],          desc: 'Serveur de modèles LLM local (llama, mistral...).', popular: true },
  { id: 'nginx',  name: 'Conteneur Nginx',   icon: 'globe',       category: 'Network',      provider: 'Docker',    tags: ['Proxy', 'TLS'],        desc: "Reverse proxy + TLS auto via Let's Encrypt." },
];
