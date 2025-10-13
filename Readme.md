# EC2 Instance Migration System — Development README

Working draft for maintainers & contributors while the project is under active development. Coordinate in ACM Discord/Slack (project channel or #projects).

Directors / Contacts: Tobi (Director) and Prajit Viswanadha — DM on Discord

---

## Status & Links

- Phase: In Development
- Project board: {{PROJECT_BOARD_URL}}
- Communication: Discord #{{project-channel}} (or team preference for Slack, etc.)
- Open issues: use repo Issues; prefer labels `good first issue` and `help wanted` thoughtfully

---

## Getting Started

# EC2 Instance Migration System

[![Python: 3.11+](https://img.shields.io/badge/python-3.11%2B-blue)](https://www.python.org/)
[![Build Status](https://img.shields.io/badge/build-unknown-lightgrey)](#)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)

Automated EC2 Instance Migration System — a Python + boto3-based toolkit that migrates EC2 instances (AMIs, snapshots, EBS volumes, networking/security constructs) across AWS accounts and regions with strong security controls, monitoring, and robust error handling.

This project is intended for platform and cloud engineers who need repeatable, audited cross-account or cross-region EC2 migrations with minimal downtime and automated rollback.

---

## Architecture (diagram placeholder)

![Architecture diagram placeholder](docs/architecture.png)

Description of data flow:

- Source account: read-only (least privilege) access to list and snapshot instances, create AMIs and export snapshots.
- Migration controller (this project) orchestrates snapshot/AMI creation, encryption key management, cross-account copy operations, security group and VPC resource deployment (via CloudFormation StackSets), and validation checks.
- Destination account(s)/regions: receive AMIs, snapshots and EBS volumes; CloudFormation StackSets deploy required networking/security constructs before resource instantiation.
- Monitoring/Alerts: CloudWatch metrics → SNS/SQS → Lambda handlers for real-time alerting and automated remediation.
- Rollback/Cleanup: on failure the controller triggers rollback flows: delete partial copies, revoke temporary IAM grants, and notify operators.

> Replace `docs/architecture.png` with your visual diagram (recommended: draw.io, Lucidchart or PlantUML export). The diagram should show accounts, regions, S3 snapshot transfer, KMS keys, VPC/SG provisioning, and notification paths.

---

## Features

This system provides the following capabilities:

1. Automated EC2 migration using Python, boto3, multithreading, and async techniques — typically achieves ~50% faster transfers vs single-threaded orchestration for bulk migrations.
2. AWS SSO integration for secure cross-account role assumption and interactive operator sessions.
3. Comprehensive encryption/decryption for AMIs, snapshots, and EBS volumes using AWS KMS and envelope encryption.
4. Intelligent Security Group classification (referencing vs non-referencing) with targeted migration and reference rewriting to preserve access controls.
5. AWS CloudFormation StackSets for deploying security groups, routing, and networking in destination accounts prior to instance provisioning.
6. IAM role-based access control for S3, SNS, KMS, EC2, and other AWS services; uses least-privilege principles and short-lived credentials.
7. Network diagnostics using AWS Cloud Shell (traceroute, curl, ping) and automated connectivity checks for multi-region VPC troubleshooting.
8. Automated rollback and resource cleanup on migration failures with idempotent undo operations.
9. Real-time alerting via AWS SNS, SQS, and Lambda for rapid incident response and operator escalation.

---

## Prerequisites

- AWS accounts: source and destination account IDs, with an administrator or delegated security contact.
- AWS SSO configured for your organization (recommended) or alternatively configured named profiles with cross-account roles.
- AWS CLI v2 installed and configured for SSO (if using SSO): https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-sso.html
- Python 3.11+ (3.11 recommended)
- System packages: git, zip, unzip
- Required Python libraries (listed in Installation section)
- IAM and KMS permissions: see the minimal permission set below.

Minimal IAM permissions (high-level):

- ec2:DescribeInstances, CreateImage, CreateSnapshot, CopyImage, CopySnapshot, RegisterImage, DeleteSnapshot, DeleteImage
- kms:Encrypt, Decrypt, CreateGrant, DescribeKey, RetireGrant
- s3:PutObject, GetObject, ListBucket, DeleteObject
- sts:AssumeRole, GetCallerIdentity
- cloudformation:CreateStackSet, CreateStackInstances, DescribeStackSetOperation
- sns:Publish, CreateTopic
- sqs:SendMessage, ReceiveMessage
- iam:PassRole (for StackSet service role)

Note: This list is intentionally high-level. Refer to `docs/iam-policies.md` (recommended) for concrete least-privilege JSON policies.

---

## Installation

Follow these steps to install and prepare the migration toolkit locally.

1. Clone the repository and enter the project directory:

```bash
git clone https://github.com/zaineel/Cloud_Migration.git
cd Cloud_Migration
```

2. Create and activate a Python virtual environment (recommended):

```bash
python3 -m venv .venv
source .venv/bin/activate
```

3. Install Python dependencies:

```bash
pip install -r requirements.txt
```

4. Optional: install development tools:

```bash
pip install -r requirements-dev.txt  # optional linting/test tools
```

5. Configure AWS CLI for SSO or profile-based access (see Configuration below).

---

## Configuration

This project supports two authentication patterns: AWS SSO (recommended) and long-lived profile credentials (for automation).

Configuration files used by the toolkit:

- `config.yml` — main migration configuration (accounts, regions, KMS key ARNs, migration batches)
- `.env` — local sensitive overrides (not checked in; see `.env.example`)

Example `config.yml` snippet:

```yaml
source_account: 111122223333
destination_accounts:
  - id: 444455556666
    region: us-west-2
    stackset_instance_ou: ou-migration
default_region: us-east-1
kms_key_map:
  us-east-1: arn:aws:kms:us-east-1:444455556666:key/abcd-1234
  us-west-2: arn:aws:kms:us-west-2:444455556666:key/efgh-5678
concurrency: 8
async_workers: 16
```

Example `.env` (DO NOT COMMIT):

```ini
# AWS profile or SSO profile to use
AWS_PROFILE=my-sso-profile
# Optional: temporary credentials (if not using SSO)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_SESSION_TOKEN=...
```

AWS SSO setup (operator flow):

1. Configure SSO and assign a permission set that allows sts:AssumeRole into the migration role in target accounts.
2. On operator workstation, run:

```bash
aws sso login --profile my-sso-profile
aws sts get-caller-identity --profile my-sso-profile
```

3. The toolkit can use the named profile to call STS:AssumeRole into cross-account migration roles.

KMS & encryption:

- Ensure destination account has a CMK for encrypting copied snapshots/AMIs.
- The migration controller will create encryption grants (not permanent key policies) during copy operations and retire them after completion.

---

## Usage

This project exposes CLI entrypoints and a Python API for automation and CI/CD.

CLI examples (assumes venv activated):

1. Dry-run a migration plan for a single instance:

```bash
python -m migrate.controller plan \
  --instance-id i-0123456789abcdef0 \
  --source-profile my-sso-source \
  --dest-profile my-sso-dest \
  --config config.yml \
  --dry-run
```

2. Execute migration with parallel transfers and real-time alerts:

```bash
python -m migrate.controller run \
  --plan-file plans/plan-2025-09-30.yaml \
  --concurrency 8 \
  --notify-topic arn:aws:sns:us-east-1:444455556666:migration-alerts
```

3. Rollback a failed migration (idempotent):

```bash
python -m migrate.controller rollback --migration-id 20250930-01
```

API snippet (assume boto3 session via SSO profile):

```python
from migrate.controller import MigrationController
from botocore.session import Session

aws_sess = Session().create_client('sts')
# ... create boto3.Session with SSO profile or assumed role
controller = MigrationController(boto_session=my_boto3_session, config='config.yml')
result = controller.run(instance_ids=['i-012...'], dry_run=False)
print(result.summary())
```

Common migration scenarios documented:

- Single-instance, same-account, cross-region migration (preserve private IPs with ENI reattachment workflows).
- Cross-account migration to a shared services account with CloudFormation StackSet-driven network provisioning.
- Bulk migration (100+ instances) using batch schedules and concurrency tuning.

---

## Security Best Practices

- Use AWS SSO with permission sets for operator access. Do not embed long-lived root keys.
- Apply least-privilege IAM roles for the migration controller and StackSet execution roles.
- Encrypt snapshots and AMIs with customer-managed KMS keys and grant only temporary access during copy operations.
- Use S3 bucket policies, VPC endpoints, and private S3 transfer acceleration when moving snapshot exports between regions.
- Enable CloudTrail, CloudWatch Logs, and Config recording for both source and destination accounts for full auditability.
- Sanitize and validate Security Group rules. The toolkit classifies SGs into referencing and non-referencing and rewrites references when required — review before applying in destination.
- Review and rotate any automation credentials; prefer ephemeral SSO tokens and assume-role flows.

---

## Troubleshooting

Common issues and quick fixes:

- PermissionDenied / AccessDenied when copying snapshots: Ensure both source and destination KMS keys allow the copying principal and that IAM roles have kms:CreateGrant.
- AMI copy fails with "Encryption not supported": check snapshot encryption state and use `CopySnapshot` with `KmsKeyId` in destination.
- Security Group conflicts due to referencing rules: use the `--dry-run` plan to surface references and enable --rewrite-sg to automatically translate rules.
- Long snapshot copy timeouts: increase concurrency cautiously; monitor CloudWatch metrics and S3 transfer throughput.
- Cross-account STS assume role errors: verify trust policy of the destination role includes the source account and the role name being assumed.

Diagnostic commands (Cloud Shell):

```bash
# From AWS CloudShell in the destination region
traceroute -n 8.8.8.8
curl -v https://s3.us-west-2.amazonaws.com
ping -c 4 10.0.1.5  # inside a VPC via bastion or session-manager port-forward
```

Logs & Alerts:

- Check CloudWatch Logs group `/migration/controller` for step-by-step orchestration logs.
- SNS topic configured for alerts will forward critical failures to subscribed emails/SMS/SQS.

---

## Performance & Optimization

- Measured improvement: using multithreading + async IO for snapshot upload and manifest copy phases yields ~50% faster end-to-end transfers for large-batch migrations (measured on 10 instances with 500GB of aggregate EBS data). Your results will vary by region and network.
- Tuning knobs:
  - `concurrency` and `async_workers` in `config.yml` — increase for high-bandwidth hosts.
  - Use S3 Transfer Acceleration or S3 multipart uploads for snapshot export/import.
  - Prefer same-AZ snapshot copy when possible to avoid cross-AZ network egress.
  - Use optimized instance types for the migration controller when orchestrating large bulk jobs.

Benchmark example (local measurement):

```text
# Baseline: single-threaded copy = 100 minutes
# Multithreaded (concurrency=8, async_workers=16) = ~50 minutes
```

---

## Contributing

We welcome contributions from platform engineers, security reviewers, and automation enthusiasts. Please follow these guidelines:

1. Open an issue describing your enhancement or bug with reproduction steps.
2. Create a small, focused branch: `feat/<short-desc>` or `fix/<short-desc>`.
3. Use Conventional Commits in PR titles.
4. Add unit tests for new logic and integration tests for end-to-end flows where feasible.
5. Update `docs/` with architecture or security changes.

For development:

```bash
# run linters and tests
source .venv/bin/activate
pip install -r requirements-dev.txt
pytest -q
ruff check .
```

---

## Maintainers & Support

=======

- Maintainers: Zaineel Mithani ([@zaineel](https://github.com/zaineel)), Aroudra ([@aroudrasthakur](https://github.com/aroudrasthakur)), Tanzid Noor Azad ([@TanzidAzad](https://github.com/TanzidAzad)), Soumik Sen ([@soumiksen](https://github.com/soumiksen)), Hani Markos ([@hm-22](https://github.com/hm-22)), Rachelle Centeno Azurdia ([@rachelle9026](https://github.com/rachelle9026))
- Directors / Contacts: Tobi and Prajit Viswanadha — DM on Discord
