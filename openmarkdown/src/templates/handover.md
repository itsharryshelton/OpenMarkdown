# Handover Document: Name of Project
**Customer:** 

**Third Party:** 

**MSP:**   

**Date:** 

**Lead Engineer:** 

---

## 1. Executive Summary
This document outlines the technical details and access credentials for....

**Architecture & Identity Context:**
Enter details here

### 1.1 Architecture Topology

Enter Mermaid Diagram here


## 2. Access Credentials
**Access should be verified immediately upon receipt**. Password links provided below are **one-time use only**

| Username            | Role / Access Level    | One-Time Secret Link (Password) | Notes                       |
| :--------------------| :-----------------------| :--------------------------------| :----------------------------|
| `LocalAdminUser`    | VM Local Administrator |                                 | VM Local Admin access       |
| `SQLAdminUser`      | SQL Database Owner     |                                 | Service account for SQL Ops |
| `DomainAccountName` | Domain Account         |                                 | Read Access to Fully Tree   |


| Identity Provider | User or Group       | Type                   | Authentication | Access Method                                        |
| :------------------| :--------------------| :-----------------------| :---------------| :-----------------------------------------------------|
| `AD DS`           | `DomainAccountName` | Direct Assignment      | AD DS          | As above - Read Access to Fully Tree                 |
| `Entra ID`        | `All Staff`         | Enterprise Application | Entra ID       | Entra ID Enterprise Application Single Sign On (SSO) |
| `VM Local Users`  | `LocalAdminUser`    | Local Group Membership | Local          | Use generated passwords for direct VM access.        |

---

## 3. Virtual Machine Details
The Virtual Machine (VM) is located within the `X` region and is protected by Network Security Groups (NSGs).

| VM Name | Operating System | Private IP | Spec (SKU) | Purpose |
| :--------| :-----------------| :-----------| :-----------| :--------|
| `X`     | X                | `X`        | `X`        | X       |

X has an additional dedicated Standard SSD (128GB) for the Apps, "G" Drive.

**Access Method:**
*   This VM has been granted access over ports `X`,`X`,`X` from the following IPs: `X` (or enter method)

---

## 4. SQL Database Information
The SQL environment is deployed using Azure SQL Database (PaaS).

| Attribute           | Details                        |
| :--------------------| :-------------------------------|
| **Server Name**     | `X`                            |
| **Database Name**   | `X`                            |
| **Connection Path** | `X`                            |
| **Collation**       | `SQL_Latin1_General_CP1_CI_AS` |
| **Authentication**  | Entra ID / SQL Authentication  |

**Connectivity:**
*   **Firewall:** The SQL Server firewall is configured to allow access from the Application VM Subnet only.
*   **Public Access:** Disabled. All traffic travels via Private Endpoint.

---

## 5. Storage Account & Azure Files
The environment utilises an Azure Storage Account for shared file access (Azure Files).

| Attribute                | Details                                                       |
| :-------------------------| :--------------------------------------------------------------|
| **Storage Account Name** | `x`                                                           |
| **File Share Name**      | `x` (X Drive), `y` (Y Drive)                                  |
| **Private Endpoint IPs** | `x`                                                           |
| **Public Access**        | Disabled                                                      |
| **File Share Paths**     | `\\x.file.core.windows.net\x` , `\\x.file.core.windows.net\y` |
| **Authentication**       | Shared Key Authentication                                     |

---

## 6. Backup & Disaster Recovery
For context, data protection is configured for each resource if a restore is required:

| Resource Type       | Backup Method        | Type |
| :--------------------| :---------------------| :-----|
| **Virtual Machine** | Backup Provider Name | Type |
| **SQL Database**    | Backup Method        | Type |
| **Azure Files**     | Backup Method        | Type |

---

## 7. Public Access & Application Proxy
External access to the application is secured and routed without the need for public port forwarding.

*   **Access Method:** Microsoft Entra ID Application Proxy is installed and configured. This service facilitates secure remote access to the internal web application without opening inbound ports on the firewall, enforcing Entra ID Conditional Access policies.
  *   **User Access:** Users should be added to the **"Application Name - Application Access**" Entra ID Group to gain access to the Enterprise Application.

| Enterprise Application Name | Application ID | Object ID | Reply URL                        | Public URL                       | SSO URL                                                         |
| :----------------------------| :---------------| :----------| :---------------------------------| :---------------------------------| :----------------------------------------------------------------|
| Application Name            | `x`            | `x`       | `https://application.domain.com` | `https://application.domain.com` | `https://launcher.myapps.microsoft.com/api/signin/x?tenantId=x` |

---

## 8. Pre-Handover Testing
Prior to this handover, the Cloud Operations Team successfully conducted the following verification tests to ensure the environment is fully operational and secure:

*   **SQL Database Connectivity:** SQL Server Management Studio (SSMS) v22 has been installed on the application VM. Successful connections to the `x` database have been established and verified.
*   **Identity & DNS Resolution:** The `x` domain has been confirmed as reachable from the VM. DNS queries successfully resolve against the Identity VNet Domain Controllers.
*   **Azure Files Connectivity:** The `x` and `y` Azure File shares have been successfully mapped to the VM using the Storage Account Shared Key, and read/write access has been confirmed.
*   **NSG & Network Isolation:** Outbound lateral movement (RDP/SMB) from the DMZ to the Identity VNet has been explicitly tested and confirmed blocked, validating the Zero-Trust boundary.
*   **Ingress Whitelisting:** External RDP/SSH access has been tested and confirmed to be restricted *strictly* to the Concurrent Engineering IPs provided.
*   **Entra ID Application Proxy:** The public URL (`https://application.domain.com`) has been configured; pending the SSL Cert CSR from Concurrent per original scope so we can purchase/apply it.

---

## 9. Support & Escalation
For any technical issues regarding the infrastructure build, please contact the Cloud Operations Team or the support desk via the usual channels.

*   **Service Desk:** support@example.com
*   **Emergency Escalation:** 0330 024 2000
*   **Reference:** X - Handover

---
**Document Status:** Final  
**Authorised by:** Cloud Operations Team
