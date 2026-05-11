# MindNeedAI Architecture Diagrams

This document provides balanced architectural visualizations for the MindNeedAI platform, offering a clear view of the system's components and workflows without unnecessary complexity.

## 1. Technology Stack Overview

This diagram illustrates the core technologies powering the platform, organized by their role in the system.

```mermaid
graph TD
    subgraph Client_Side [Frontend Application]
        React[React + Vite<br/>User Interface]
        Axios[Axios<br/>API Communication]
    end

    subgraph Server_Side [Backend Infrastructure]
        FastAPI[FastAPI Server<br/>Core Logic]
        Auth[JWT Auth<br/>Security]
        DB[(PostgreSQL<br/>Data Storage)]
    end

    subgraph Intelligence [AI Processing Layer]
        Models[Local Models<br/>RoBERTa / Wav2Vec2]
        GPT[OpenAI GPT-4<br/>Clinical Reasoning]
    end

    %% Connections
    React <-->|HTTPS Requests| FastAPI
    FastAPI <-->|Read/Write| DB
    FastAPI -->|Inference| Models
    FastAPI -->|Reasoning| GPT
```

---

## 2. Analysis & Safety Workflow

This flowchart details how user input is processed, analyzed for safety, and turned into actionable insights.

```mermaid
graph TD
    User([User]) -->|1. Inputs Data| Input[/Text, Audio, or Video/]
    Input --> API[Backend API]
    
    subgraph Analysis_Engine [AI Analysis Engine]
        API -->|2. Process| Emotion[Emotion Detection]
        Emotion -->|3. Interpret| Reasoner[Agentic Reasoner]
    end
    
    Reasoner --> Risk{Risk Check}
    
    Risk -- Critical --> Emergency[**Emergency Protocol**<br/>Notify Doctor & Contacts]
    Risk -- Ambiguous --> Review[**Human Review**<br/>Flag for Clinician]
    Risk -- Safe --> Save[Save Results]
    
    Emergency --> Save
    Review --> Save
    
    Save -->|4. Feedback| Dashboard[User Dashboard<br/>Results & Recommendations]
```

---

## 3. Doctor-Patient Care Loop

This diagram demonstrates the collaborative care cycle between doctors and patients, including assessments and wellness forms.

```mermaid
sequenceDiagram
    participant Doc as Doctor
    participant Sys as MindNeedAI System
    participant Pat as Patient

    Note over Doc, Pat: 1. Initiation Phase
    Doc->>Sys: Create Assessment Request
    Sys->>Pat: Send Notification
    
    Note over Doc, Pat: 2. Patient Action
    Pat->>Sys: Complete PHQ-9 / GAD-7
    Sys->>Sys: Auto-Score & Analyze
    
    Note over Doc, Pat: 3. Clinical Review
    Sys->>Doc: Alert: Results Ready
    Doc->>Sys: Review Scores & AI Insights
    
    opt Intervention Required
        Doc->>Sys: Update Care Plan / Notes
        Sys->>Pat: Update Recommendations
    end
```
