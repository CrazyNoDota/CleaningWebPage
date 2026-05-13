# **Strategic Deployment and Architecture Blueprint for a Mobile-First Cleaning Agency in Kazakhstan**

The deployment of a cross-platform mobile application for a service-based enterprise—specifically a cleaning agency operating within the Republic of Kazakhstan—requires a rigorous alignment of software architecture, localized payment gateways, and stringent data sovereignty compliance. The Kazakhstani digital ecosystem is highly idiosyncratic, dominated by local financial super-apps like Kaspi, heavily regulated by internal data localization laws, and characterized by specific consumer behaviors regarding recurring subscriptions, mobile interactions, and digital trust. This comprehensive report outlines the definitive technical and business deployment plan for a dual-role cleaning service application, encompassing the customer interface for booking services and the agency interface for managing operations, cleaners, schedules, and payments. The analysis covers the complete production lifecycle from architectural selection to App Store publishing, operational infrastructure, and risk mitigation.

## **Mobile Application Architecture**

The selection of a technology stack for a dual-role application must balance time-to-market, cross-platform consistency, and the capability to handle complex asynchronous state management, such as real-time cleaner tracking and dynamic scheduling. The architecture must serve two distinct user profiles: the consumer seeking frictionless booking and payment, and the cleaner requiring robust scheduling, routing, and task management capabilities.

### **Client-Side Technology Stack: Framework Comparison**

The primary evaluation for mobile client development lies between Native Development (Swift for iOS, Kotlin for Android), React Native, and Flutter.  
Native development provides unparalleled performance and deep integration with operating system-level APIs. However, maintaining two separate codebases for a service marketplace significantly inflates the initial development budget and doubles the ongoing maintenance costs.1 Given the ubiquitous need for feature parity between iOS and Android users in a localized service application, cross-platform frameworks present a more economically viable and strategically agile choice.  
React Native relies on a JavaScript bridge to communicate with native components. While popular, this bridge can introduce performance bottlenecks during high-frequency UI updates, such as rendering real-time geolocation tracking of cleaners on a map interface.  
Flutter is the recommended framework for this deployment. Flutter’s proprietary rendering engine bypasses original equipment manufacturer (OEM) widgets, delivering consistent user interface components across the heavily fragmented Android device market prevalent in Kazakhstan. Furthermore, Flutter’s architecture is inherently suited for real-time applications via streams. The implementation should adhere strictly to Clean Architecture principles.3 By decoupling the Presentation, Domain, and Data layers, the application ensures that complex business logic—such as scheduling algorithms, pricing calculations, and localized payment routing—remains independent of the user interface.4 This separation of concerns guarantees that as the agency scales and introduces new service tiers, the core logic remains stable and highly testable.

### **Backend Architecture Recommendations**

The backend serves as the orchestration layer, managing user states, dispatching push notifications, handling payment webhooks, and interacting with third-party Customer Relationship Management (CRM) systems. The evaluation of backend technologies includes Node.js (specifically the NestJS framework), Python (Django), and Backend-as-a-Service (BaaS) platforms like Firebase or Supabase.  
While Firebase and Supabase offer rapid prototyping capabilities and out-of-the-box real-time synchronization, their reliance on external cloud infrastructure presents a fatal flaw for this project: compliance with Kazakhstan’s data localization laws.6 Hosting the personally identifiable information (PII) of Kazakhstani citizens on Google Cloud or AWS servers located in Europe or the United States is a direct violation of local statutes. Therefore, a custom backend deployed on local infrastructure is a mandatory legal requirement.  
NestJS, operating on the Node.js runtime, is the recommended backend framework. Its heavily opinionated, Angular-inspired architecture enforces strict TypeScript typing, dependency injection, and modularity. This is critical when integrating diverse third-party APIs, such as Kaspi, Freedom Pay, local SMS gateways, and CRMs like Bitrix24. Furthermore, NestJS natively supports microservices and WebSockets, the latter being an essential protocol for real-time location tracking.8 Django is a viable alternative if the development team possesses deep Python expertise, but Node.js generally handles concurrent WebSocket connections for real-time tracking more efficiently due to its event-driven, non-blocking I/O model.

### **Recommended Database and Caching Layer**

The data layer requires strict ACID (Atomicity, Consistency, Isolation, Durability) compliance to prevent race conditions during booking operations. For instance, the system must guarantee that two customers cannot book the same cleaner for overlapping time slots. PostgreSQL is the optimal relational database for managing user profiles, financial ledgers, and complex operational schedules.10  
To support the real-time geolocation tracking of cleaners without overloading the primary PostgreSQL database with high-frequency write operations, a Redis caching layer must be implemented. Redis will handle high-frequency location updates, session management, and rate-limiting, while PostgreSQL persists the final historical route and completed booking logs for analytics and payroll purposes.

### **Authentication Architecture**

Authentication must prioritize both stringent security and user convenience. In Kazakhstan, mobile number authentication via One-Time Passwords (OTP) is the prevailing digital standard. Email authentication yields significantly lower conversion rates in the local market, as consumers expect mobile-first interactions. The architecture will utilize JSON Web Tokens (JWT) for stateless session management.  
Due to the unreliability of international SMS providers and high financial costs—for example, Twilio charges approximately $0.3382 per SMS to Kazakhstan 11, while Plivo charges upwards of $0.2709 12—the architecture must integrate local aggregators. Mobizon provides direct connectivity to local telecommunications operators (Altel, Beeline, K-Cell, Tele2) at significantly lower rates (approximately €0.1916 per message) and ensures higher delivery success rates bypassing international carrier firewalls.13  
OAuth and social login mechanisms (Apple ID, Google Sign-In) should be offered as secondary options. However, these introduce specific risks regarding data privacy and user deduplication. If a user authenticates via Apple ID but later attempts to log in via their phone number, the backend must implement a robust account linking strategy to prevent the creation of orphaned or duplicate profiles, which complicates CRM management and cleaner dispatching.

### **Admin Panel Architecture**

The admin panel serves as the central command center for agency dispatchers, customer support representatives, and financial controllers. Rather than building a monolithic admin panel within the mobile backend, the architecture should separate the admin frontend. A Single Page Application (SPA) built with React.js or Vue.js, communicating with the NestJS backend via a secured REST API, provides the necessary flexibility. This panel must include modules for map-based live tracking, manual schedule overrides, refund processing, and cleaner onboarding. For advanced CRM capabilities, this custom panel should be seamlessly integrated with Bitrix24, passing lead data and task statuses bidirectionally.

### **Scalability Considerations**

As the agency expands its operations across multiple cities (e.g., Almaty, Astana, Shymkent), the system must scale horizontally. The NestJS backend should be containerized using Docker and deployed within a Kubernetes cluster. This allows the system to automatically spin up additional backend pods during peak booking hours (typically weekends or pre-holiday periods) and spin them down during low-traffic periods. Database scalability should be managed through read-replicas in PostgreSQL, ensuring that heavy analytical queries from the admin panel do not degrade the performance of the consumer-facing mobile application.

| Architectural Component | Recommended Technology | Strategic Justification |
| :---- | :---- | :---- |
| **Mobile Client (Dual Role)** | Flutter | Unified codebase, superior performance on fragmented Android devices, robust Clean Architecture support, avoiding dual native team costs. |
| **Backend Framework** | Node.js (NestJS) | Strict TypeScript typing, excellent WebSocket support for live tracking, enterprise-grade modularity for third-party integrations. |
| **Primary Database** | PostgreSQL | Relational integrity for bookings, schedules, and financial transactions. |
| **Caching & Real-time Data** | Redis | High-frequency location updates, session management, and rate-limiting. |
| **Authentication System** | JWT \+ SMS OTP | Standard security model in KZ, utilizing local SMS aggregators (Mobizon) for cost efficiency and reliable delivery. |
| **Admin Panel** | React.js SPA | Decoupled frontend for operational management, integrated with Bitrix24. |

## **Kazakhstan Payment Integration Landscape**

Accepting payments in Kazakhstan requires deep integration with local financial ecosystems. International payment gateways like Stripe are not natively available for legal entities incorporated in Kazakhstan. Consequently, the architecture must rely on local super-apps and payment gateways to process transactions, manage settlements, and execute recurring billing.

### **The Kaspi Ecosystem and Integration Mechanics**

Kaspi.kz is the dominant financial super-app in Kazakhstan, encompassing payments, e-commerce, and P2P transfers.14 Integration with Kaspi Pay is non-negotiable for a consumer-facing mobile application in this market, as the vast majority of digital transactions utilize this ecosystem.  
Kaspi provides several integration modalities:

1. **QR Code Payments**: Utilized primarily for in-store physical transactions or dynamic invoice generation upon service completion. The backend generates a QR token, which is displayed on the cleaner's app. The consumer scans this QR code using their Kaspi app to authorize the transfer.16  
2. **eCommerce API (Redirect / Deep Link)**: This is the primary flow for in-app mobile bookings. The backend generates an order and sends a POST request to Kaspi's API. Kaspi returns a payment URL, which the mobile app opens via a Deep Link (redirecting directly into the Kaspi application) or a secure WebView.16

The payment flow execution is critical. The NestJS server initiates the transaction by sending the order details and amount, accompanied by a cryptographic signature, to the Kaspi API. Upon successful processing by the user within the Kaspi environment, Kaspi dispatches a server-to-server webhook to the application's backend. The backend must verify the webhook's signature, store the kaspiTransactionId (which is essential for potential refunds), and update the booking status to confirmed.16 Webhook idempotency is paramount; the backend must handle duplicate webhooks gracefully to prevent double-crediting a user's account. Commission fees for merchant acquiring through Kaspi typically range between 0.8% and 1.2%.17

### **Comparative Analysis of Local Payment Gateways**

While Kaspi is mandatory for market penetration, relying solely on a single provider introduces a single point of failure and limits functionality regarding invisible recurring subscriptions. Alternative gateways provide redundancy and support features that Kaspi handles differently.

* **Kaspi**: Excellent for one-time payments and user trust. However, its subscription support often requires the user to manage the subscription explicitly within the Kaspi Super App interface, removing a degree of control and branding from the cleaning agency's proprietary application.18  
* **Freedom Pay**: A highly robust local gateway that supports true recurring payments (subscriptions) via an API endpoint. Freedom Pay handles card tokenization, allowing the user to link their card once. Subsequent charges utilize the pg\_recurring\_profile parameter to debit the user automatically in the background without requiring them to re-enter the app or authenticate a deep link.19  
* **Halyk E-pay**: Supported by Halyk Bank, offering a comprehensive Mobile SDK for iOS and Android. It supports Apple Pay, Google Pay, and saved card functionality (tokenization).21 This is ideal for users who prefer standard card input over super-app redirection.  
* **CloudPayments.kz**: Offers a well-documented mobile SDK and supports recurring payments via card tokens. It is highly developer-friendly but requires strict PCI DSS compliance scoping depending on how the SDK is implemented within the mobile client.23

| Feature / Gateway | Kaspi Pay | Freedom Pay | Halyk E-pay | CloudPayments.kz |
| :---- | :---- | :---- | :---- | :---- |
| **Market Penetration** | Dominant (\~80%+) | High | Moderate/High | Moderate |
| **Integration Method** | Deep Link / API / QR | API / Widget | SDK / API | SDK / Widget |
| **Auto-Renewal Subs** | App-managed | Excellent (Profile ID) | Yes (Tokenization) | Yes (Tokenization) |
| **Apple/Google Pay** | No | Yes | Yes | Yes |
| **Typical Commission** | 0.8% \- 1.2% | \~2.5% | Variable by volume | Variable by volume |

### **Settlement Process and KYC Requirements**

The settlement process in Kazakhstan typically occurs on a T+1 or T+2 basis, meaning funds processed today are transferred to the agency's corporate bank account within one to two business days. To integrate these gateways, the agency must undergo rigorous Know Your Customer (KYC) and business verification processes. The operating legal entity (usually a Limited Liability Partnership or TOO) must provide its Business Identification Number (BIN), the Director's state-issued identity documents, and an Electronic Digital Signature (EDS) to sign the acquiring contracts electronically.

## **Subscription System Architecture**

The financial viability of a modern cleaning agency relies heavily on recurring revenue, transitioning customers from ad-hoc bookings to weekly or monthly cleaning plans. The implementation of subscriptions in a mobile app involves navigating both technical scheduling challenges and the notoriously strict policies of global app stores.

### **Subscription Modalities**

The system must support diverse subscription tiers:

* **Weekly Cleaning**: High frequency, lower margin per visit, requires strict automated scheduling to ensure the same cleaner is dispatched to build customer trust.  
* **Monthly Plans**: Lower frequency, deep cleaning focus.  
* **Auto-Renewing Subscriptions**: The holy grail of the service model, where the user's card is charged automatically at the beginning of each billing cycle without manual intervention.

### **App Store Policies and External Payment Exemption**

The primary risk in deploying a subscription model is app rejection due to violations of Apple's and Google's in-app purchase (IAP) guidelines. Apple's App Store Review Guidelines mandate that digital goods and services must use Apple's native IAP system, which levies a severe 15% to 30% commission.26 For a cleaning agency operating on thin physical service margins, surrendering 30% of gross revenue is economically fatal.  
However, cleaning services fall under a crucial, explicit exception within the guidelines. According to Apple's Guideline 3.1.3(e) regarding "Goods and Services Outside of the App," if an application enables the purchase of physical goods or services that will be consumed outside of the application, the developer *must* use payment methods other than native in-app purchase, such as traditional credit card entry, Apple Pay, or local gateways.27 This mandate is highly advantageous, as it explicitly permits—and in fact requires—the cleaning agency to bypass the 30% commission entirely and utilize local payment gateways like Kaspi or Freedom Pay.

### **Recommended Subscription Strategy and Architecture**

Given the regulatory environment and App Store guidelines, the subscription architecture must be entirely decoupled from native App Store and Google Play billing systems. The recommended architecture leverages Freedom Pay for its superior background tokenization capabilities.19

1. **Initial Tokenization**: When a customer selects a "Weekly Cleaning Plan," the app initiates a transaction via Freedom Pay. The user enters their card details into a secure payment widget provided by the gateway. During this flow, the user explicitly consents to the terms of regular payments.20  
2. **Profile Generation**: Upon successful initial payment, the Freedom Pay gateway returns a secure token (pg\_recurring\_profile) to the NestJS backend.19  
3. **Backend Scheduling Engine**: The NestJS backend utilizes a cron job scheduler (or a distributed task queue like BullMQ backed by Redis) to track subscription cycles for all active users.  
4. **Automated Billing Execution**: 24 to 48 hours prior to the next scheduled cleaning appointment, the backend dispatches a server-to-server POST request to the Freedom Pay API using the recurring profile token. If the transaction is successful, the booking is confirmed, and the dispatch algorithm assigns a cleaner.  
5. **Failure Handling and Dunning**: If the auto-renewal fails (e.g., due to insufficient funds or an expired card), the system automatically downgrades the user to a manual payment state. It then dispatches a push notification and an SMS via Mobizon, prompting the user to update their payment method or settle via a manually generated Kaspi invoice.

## **iOS and Android Deployment Requirements**

Publishing a mobile application involves navigating the complex bureaucratic, technical, and security requirements of both the Apple App Store and Google Play Store.

### **iOS Deployment Requirements**

Apple maintains a notoriously strict review process. To publish the app under the cleaning agency's corporate brand, the company must enroll in the Apple Developer Program as an Organization, which costs $99 annually.  
**D-U-N-S Number Acquisition** The foremost requirement for organizational enrollment is a D-U-N-S (Data Universal Numbering System) Number, a globally recognized nine-digit corporate identifier.28 In Kazakhstan, D-U-N-S numbers are assigned and managed by Interfax-D\&B, the exclusive regional partner of Dun & Bradstreet.30

1. The TOO must apply directly through the Interfax-D\&B portal, submitting official incorporation documents.31  
2. The verification process validates the legal entity's operational status and physical address.28  
3. Once issued (standard processing takes 5-30 days, though expedited services exist), the D-U-N-S number unlocks the ability to create the organizational Apple Developer Account.29

**Certificates, TestFlight, and Review Workflow**  
Upon account activation, the development team generates the necessary Distribution Certificates and Provisioning Profiles via the Apple Developer portal. The compiled application is uploaded via Xcode to App Store Connect. Before production rollout, the application undergoes rigorous Quality Assurance (QA) via TestFlight, allowing up to 10,000 external beta testers to evaluate the booking flow, payment redirects, and cleaner tracking logic.  
When submitting for the final App Store review, developers face significant risks of rejection if the reviewer misinterprets the app's business model. To mitigate this, developers must explicitly clarify in the App Store Connect review notes that the application facilitates *physical, real-world services* (cleaning) and is therefore exempt from native IAP under Guideline 3.1.3(e).26 Furthermore, comprehensive test credentials (both a mock Customer account and a mock Cleaner account) must be provided to the review team to bypass OTP walls during their evaluation.

### **Android Deployment Requirements**

The Google Play Console requires a $25 one-time registration fee. Recent policy updates mandate rigorous business verification, requiring the submission of the TOO's registration documents and a government-issued identity document of the account owner.  
Android deployment mandates code signing using a cryptographic keystore. Google Play App Signing securely manages these keys in the cloud, mitigating the risk of developers losing the local keystore file, which would permanently prevent future app updates.  
The rollout strategy on Android utilizes a structured pipeline: Internal Testing, followed by Closed Testing (Alpha), Open Testing (Beta), and finally a staged Production Rollout. A staged rollout (e.g., initially releasing the update to 10% of the user base) is a critical operational safety net. It allows developers to monitor crash reports via Firebase Crashlytics and monitor backend error rates before exposing the entire customer base to a potentially flawed build.

## **Backend and Infrastructure Deployment Strategy**

The deployment pipeline and infrastructure hosting must ensure high availability, secure secret management, rapid iteration capabilities, and absolute legal compliance.

### **Cloud Providers: Global vs. Local**

The comparison of cloud infrastructure providers involves a stark dichotomy between global giants and domestic operators.  
Global providers like AWS, Google Cloud Platform (GCP), Azure, DigitalOcean, and Hetzner offer unparalleled developer experiences, managed services, and global Content Delivery Networks (CDNs). Modern Platform-as-a-Service (PaaS) solutions like Railway or Render offer incredibly fast deployment pipelines.  
However, none of these global providers currently operate data centers within the physical borders of Kazakhstan. Utilizing them to host the primary PostgreSQL database containing customer names, physical addresses, and phone numbers constitutes a direct violation of Kazakhstan’s data localization mandate (Law No. 94-V).6  
Consequently, the infrastructure must be deployed on domestic cloud providers. **PS.kz** and **Cloud.kz** are the premier domestic operators. PS.kz offers managed Kubernetes clusters, managed PostgreSQL, and S3-compatible object storage hosted in fault-tolerant data centers located in Almaty and Astana.34 Importantly, PS.kz is PCI DSS 4.0.1 certified and ISO/IEC 27001-2023 compliant, providing the necessary regulatory foundation for securely handling payment tokens and sensitive user data.34

| Cloud Provider | Datacenter Location | Compliance with Law 94-V | Managed Services | Recommendation |
| :---- | :---- | :---- | :---- | :---- |
| **AWS / GCP / Azure** | Global (No KZ) | **Violates Law** | Superior | Do Not Use for PII |
| **DigitalOcean / Hetzner** | Europe / US | **Violates Law** | Good | Do Not Use for PII |
| **Railway / Render** | Global | **Violates Law** | Excellent PaaS | Do Not Use for PII |
| **PS.kz** | Almaty / Astana | **Fully Compliant** | K8s, Postgres, S3 | **Primary Infrastructure** |

*Note: While the core database and backend must reside locally, static assets (images, app icons) can safely be cached and served via global CDNs like Cloudflare to improve load times, as static assets do not constitute personal data.*

### **Kubernetes Deployment and CI/CD Pipeline**

Given the availability of Managed Kubernetes on PS.kz, container orchestration is the optimal deployment strategy.34 The architecture involves an Ingress Controller routing external API requests and managing SSL termination. The NestJS application runs within replicated backend pods. The Kubernetes Horizontal Pod Autoscaler (HPA) will dynamically scale these pods based on CPU and memory utilization, ensuring the system remains responsive during peak booking hours.  
A robust Continuous Integration and Continuous Deployment (CI/CD) pipeline is vital for modern software teams. GitLab CI or GitHub Actions will be configured to execute automated unit and integration tests upon code commit. Upon passing, the pipeline builds Docker images of the NestJS backend, pushes them to a private container registry, and triggers a rolling update deployment to the PS.kz Kubernetes cluster, ensuring zero-downtime updates for users.

### **Security Best Practices, Backups, and Monitoring**

Visibility into system health and rigorous security protocols are critical.

* **Environment Management**: Strict separation between Development, Staging, and Production environments must be enforced. Secrets (API keys for Kaspi, Freedom Pay, and Mobizon) must be injected securely via Kubernetes Secrets, never hardcoded into the repository.  
* **Monitoring and Logging**: A localized logging stack (Elasticsearch, Fluentd, Kibana \- EFK) deployed within the cluster will aggregate logs. Prometheus and Grafana will provide real-time metrics on API latency, database query performance, and active WebSocket connections.  
* **Backups**: Automated daily backups of the PostgreSQL database must be configured, utilizing Point-in-Time Recovery (PITR) to mitigate data loss in the event of catastrophic failure or data corruption.10 Backups must be stored securely on isolated, localized S3-compatible object storage.

## **Security, Compliance, and Data Privacy**

Deploying software in Kazakhstan necessitates strict adherence to local legislation, specifically concerning data privacy and corporate compliance.

### **The Law on Personal Data and Its Protection**

The Law of the Republic of Kazakhstan on Personal Data and Its Protection (Law No. 94-V) imposes rigid data localization mandates. Article 12(2) explicitly requires that all databases containing the personal data of Kazakhstani citizens be physically located within the territory of the Republic of Kazakhstan.6  
Personal data encompasses full names, physical addresses (crucial for a cleaning service), phone numbers, and geolocation data.7 Furthermore, the law mandates the appointment of a Data Protection Officer (DPO) responsible for organizing the processing and protection of this data.33 Failure to comply can result in severe financial penalties and the immediate blocking of the application by state telecommunications regulators.37 Cross-border data transfers are heavily restricted and generally require explicit user consent, highlighting the necessity of domestic hosting.6

### **Digital Signatures (EDS) and Corporate Compliance**

Operating a business and deploying enterprise software in Kazakhstan requires interaction with state digital infrastructure. The Director of the operating legal entity (commonly a TOO) must possess a valid Electronic Digital Signature (EDS or ECP) issued by the National Certification Authority (NCA RK).40  
The EDS is equivalent to a handwritten signature and is legally required for registering the legal entity, signing acquiring contracts with payment gateways like Kaspi Pay, and registering for the mandatory Electronic Invoicing Information System (IS ESF) for online fiscalization.41 Foreign founders can obtain an Individual Identification Number (IIN) and an EDS entirely remotely via the eResidency platform, bypassing the need for physical presence at a consulate.43

### **PCI DSS and Secure Payment Handling**

Because the application handles financial transactions, Payment Card Industry Data Security Standard (PCI DSS) compliance is a concern. By utilizing Kaspi's eCommerce API redirect or Freedom Pay's secure tokenization widgets, the application avoids transmitting raw credit card numbers (PANs) through its own NestJS backend. This significantly reduces the PCI DSS compliance scope. The backend only stores secure tokens and transaction IDs, relying on the certified payment gateways to handle the cryptographic heavy lifting.

## **Operational Features and Integration**

The mobile application represents only the front-end interface; the true operational capability of the cleaning agency resides in the synchronization between the app, the backend logic, and the management systems.

### **Real-Time Cleaner Tracking and Scheduling**

Customers expect modern transparency regarding the arrival time of service personnel, akin to ride-hailing applications. Implementing real-time GPS tracking requires continuous background location updates from the Cleaner's mobile device.  
To broadcast these coordinates to the Customer app with sub-50ms latency, WebSockets are vastly superior to HTTP polling or Firebase Realtime Database.8 WebSockets maintain a persistent, bidirectional connection, drastically reducing network overhead. However, maintaining thousands of persistent connections places a heavy load on the backend. The NestJS architecture must utilize a WebSocket adapter (like Socket.io) backed by Redis Pub/Sub. This allows the WebSocket traffic to scale horizontally across multiple Kubernetes pods; if a customer is connected to Pod A and the cleaner is connected to Pod B, Redis ensures the location data is routed correctly.9  
Scheduling requires complex logic to manage recurring patterns (e.g., bi-weekly cleans on Tuesdays) and prevent double-booking.45 The database schema must account for travel time between locations, dynamic cleaner availability, and specific skill sets (e.g., standard cleaning vs. deep chemical cleaning).

### **Push Notifications and Communication**

Reliable delivery of push notifications (e.g., "Your cleaner has arrived") is critical for operational efficiency. While Firebase Cloud Messaging (FCM) is the global industry standard and free, its reliability in Kazakhstan can occasionally be compromised by aggressive local telecom firewalls or deep sleep states induced by heavily customized Android ROMs prevalent in the market.46  
To ensure delivery, a hybrid approach is recommended: utilizing FCM as the primary transport, but falling back to localized SMS notifications (via Mobizon) for critical alerts such as booking cancellations, cleaner arrivals, or payment failures.13 Premium alternatives like OneSignal or Pushwoosh offer superior analytics, A/B testing, and delivery orchestration, but they ultimately still rely on the underlying APNs/FCM infrastructure for the final mile of delivery.49

### **CRM Integration (Bitrix24)**

Managing a fleet of cleaners, resolving customer disputes, and tracking lifetime value requires a robust Customer Relationship Management (CRM) system. Bitrix24 is exceptionally dominant in the CIS region and provides comprehensive Open API integrations.52  
The custom NestJS backend must synchronize data bidirectionally with Bitrix24.

* **Customer Profiles**: New app registrations automatically generate Leads or Contacts in Bitrix24.  
* **Bookings**: App bookings are mirrored as "Deals" moving through a kanban pipeline, and as "Tasks" assigned to specific cleaners in the CRM.  
* **Field Management**: Bitrix24’s native mobile tasks and AI-generated checklist features can supplement the proprietary app for complex internal HR workflows, quality control reporting, and equipment inventory tracking.54  
* **Communications**: Integrations with WhatsApp (via local providers like ChatApp or WappChat) allow support agents to message clients directly from the Bitrix24 interface, maintaining a unified, auditable communication history.52

### **Marketing Features: Promo Codes, Referrals, and Reviews**

To drive user acquisition and retention, the backend must support a dynamic promotional engine.

* **Promo Codes**: Logic to handle percentage discounts, fixed amounts, and first-time user bonuses.  
* **Referral System**: A double-sided incentive mechanism where existing users share a unique code, granting credits to both the referrer and the referee upon successful service completion.  
* **Ratings and Reviews**: A crucial trust metric. After a service is completed, the user is prompted to rate the cleaner. Consistently high ratings trigger algorithmic preference in future dispatching, while low ratings trigger automated CRM alerts for managerial review.

## **Difficulties, Risks, and Mitigations**

A deployment of this complexity across multiple integrated systems is subject to multiple vectors of risk that must be proactively managed.

1. **Payment Disputes and Fraud**: Operating outside the App Store IAP ecosystem means the cleaning agency bears the full burden of chargebacks, payment disputes, and fraud prevention. The backend must implement velocity checks (limiting the number of bookings per device or card per hour) and strictly validate 3D-Secure tokens returned by Freedom Pay or CloudPayments.  
2. **Kaspi Architecture Limits**: Kaspi's ecosystem is heavily walled. Any technical disruption to Kaspi’s APIs or a temporary revocation of merchant credentials halts a significant portion of daily revenue. Implementing redundancy via Freedom Pay or Halyk E-pay is the only structural mitigation against this dependency.  
3. **Subscription Edge Cases**: Handling expired cards, insufficient funds, or customers attempting to cancel a subscription mid-service requires highly resilient state-machine logic in the backend to ensure cleaners are not dispatched for unpaid jobs.  
4. **Offline Behavior and Connectivity**: Cleaners operating in deep basements or remote newly built residential complexes may lose cellular connectivity. The mobile app must aggressively cache the day's schedule locally. Actions performed offline (like marking a room as "completed" or uploading service photos) must be queued in local storage (e.g., using Hive or SQLite in Flutter) and synchronized automatically upon network reconnection.  
5. **Localization Challenges**: The application must natively support both Russian and Kazakh languages to maximize market penetration. Furthermore, dynamic data such as address parsing and geocoding must accurately reflect localized naming conventions, which frequently change in Kazakhstan (e.g., rapid street renaming in major cities).

## **Comprehensive Cost Estimates**

Financial outlays span initial capital expenditure (CapEx) for development and ongoing operational expenditure (OpEx) for maintenance, infrastructure, and third-party services.

| Cost Category | Item Description | Estimated Cost (USD) | Notes |
| :---- | :---- | :---- | :---- |
| **Initial Development** | Mobile App (Flutter), Backend (NestJS), Admin SPA | $45,000 \- $70,000 | Based on regional senior developer rates (\~$20-$40/hr) over a 4-6 month development cycle.57 |
| **Infrastructure (OpEx)** | PS.kz Kubernetes, Managed Postgres, S3 Storage | $300 \- $800 / month | Scales dynamically. Local hosting carries a slight premium over AWS but guarantees legal compliance. |
| **App Store Fees** | Apple Developer, Google Play | $99/year (iOS) \+ $25 one-time (Android) | Standard mandatory platform fees. |
| **Payment Gateway Fees** | Kaspi Pay / Freedom Pay | 0.8% \- 2.5% per transaction | Deducted at source. Bypasses Apple's 30% fee, dramatically improving margins.17 |
| **SMS/OTP Costs** | Mobizon (Local Aggregator) | \~€0.1916 per SMS | Scales directly with user registration volume and critical alert dispatch frequency.13 |
| **Maintenance & Support** | Bug fixes, OS updates, Security monitoring | $2,000 \- $4,000 / month | Ongoing technical debt management, server monitoring, and adapting to iOS/Android OS updates.1 |

Note: Software development rates in Kazakhstan average approximately 5,500 KZT/hr ($12/hr) for mid-level talent, but specialized system architects and senior mobile engineers necessary for complex real-time deployments demand international market rates.57

## **Recommended Final Architecture and Roadmap**

### **Minimum Viable Product (MVP) vs. Scalable Enterprise Version**

To optimize capital deployment, the project should be segmented.

* **The MVP**: Focuses purely on core utility. Customers can book one-time cleaning services, pay via Kaspi Pay deep links, and receive SMS confirmations. Cleaners view static daily schedules. The backend is a monolithic NestJS instance connected to PostgreSQL. CRM relies on basic Bitrix24 lead dumping.  
* **The Enterprise Version**: Introduces automated Freedom Pay subscriptions, real-time WebSocket GPS tracking of cleaners, algorithmic routing optimization, in-app chat, push notification orchestration via OneSignal, and full bidirectional synchronization with Bitrix24 tasks and pipelines. The backend transitions to containerized microservices on Kubernetes.

### **Final Architectural Synthesis**

The definitive recommendation for a high-performance, legally compliant, and financially optimized enterprise deployment is as follows:

* **Mobile Client**: Flutter utilizing Clean Architecture for simultaneous, high-performance iOS and Android deployment.  
* **Backend**: Node.js (NestJS) to provide a strictly typed, microservice-ready orchestration layer capable of handling dense WebSocket traffic.  
* **Infrastructure**: PS.kz Managed Kubernetes and PostgreSQL, ensuring absolute, uncompromising compliance with Kazakhstan’s data localization laws (Law No. 94-V).  
* **Payment & Subscriptions**: A dual-gateway strategy. Kaspi Pay (eCommerce API) for immediate ad-hoc bookings due to unmatched market trust and penetration. Freedom Pay for automated, background recurring subscriptions via tokenized profiles, successfully bypassing Apple’s 30% IAP commission under Guideline 3.1.3(e).  
* **Operations**: WebSockets paired with Redis for low-latency cleaner tracking, fully integrated via REST APIs into a Bitrix24 CRM environment for comprehensive administrative and HR oversight.

### **Step-by-Step Implementation Roadmap**

**Phase 1: Legal Foundation and Compliance (Month 1\)**

* Register the TOO and acquire the Director's EDS (ECP).40  
* Initiate D-U-N-S number registration via Interfax-D\&B for the Apple Developer account.30  
* Provision localized cloud infrastructure on PS.kz and establish the Kubernetes environment.  
* Finalize API contracts and database schemas between the mobile application and the NestJS backend.

**Phase 2: Core Development and Integration (Months 2-3)**

* Develop the core Flutter application interfaces for both Customer and Cleaner roles.  
* Implement JWT authentication and SMS OTP flows utilizing Mobizon APIs.  
* Integrate Kaspi Pay for one-time booking payments, construct the eCommerce API redirect flow, and rigorously test webhook listeners for idempotency.16

**Phase 3: Advanced Operations and Subscriptions (Month 4\)**

* Integrate the Freedom Pay SDK for secure card tokenization.  
* Implement the automated cron-job billing engine to execute recurring cleaning subscriptions via Freedom Pay's API.19  
* Implement the WebSocket architecture and Redis Pub/Sub for live GPS tracking of cleaners.  
* Establish bidirectional REST API synchronization with Bitrix24 for task, deal, and lead management.55

**Phase 4: QA, Testing, and App Store Navigation (Month 5\)**

* Deploy the NestJS backend to production staging on the PS.kz cluster.  
* Distribute the mobile application via TestFlight for iOS and Google Play Closed Testing for Android.  
* Conduct aggressive edge-case testing: simulating offline states in basements, testing Kaspi webhook retries, and verifying Freedom Pay auto-renewal failure dunning processes.  
* Submit to the Apple App Store, providing explicit documentation regarding the physical nature of the service to bypass IAP restrictions.26

**Phase 5: Launch, Monitoring, and Scaling (Month 6+)**

* Execute a staged rollout to production environments, starting with a limited geographical radius (e.g., specific districts in Almaty).  
* Monitor infrastructure telemetry via Grafana and Prometheus, configuring Kubernetes HPA to scale pods dynamically as marketing campaigns drive traffic spikes.  
* Iterate continuously, gathering user feedback to optimize scheduling algorithms, cleaner routing efficiencies, and CRM automations.

By adhering strictly to this strategic blueprint, the cleaning agency establishes a technically superior, legally impregnable, and financially optimized digital ecosystem tailored specifically to the unique technological and cultural realities of Kazakhstan.

#### **Источники**

1. Cost of Mobile App Maintenance in 2025 and Why It's Important \- APPWRK, дата последнего обращения: мая 12, 2026, [https://appwrk.com/app-maintenance-cost](https://appwrk.com/app-maintenance-cost)  
2. Mobile App Maintenance Costs in 2026: A Detailed Breakdown \- Aalpha, дата последнего обращения: мая 12, 2026, [https://www.aalpha.net/articles/how-much-does-it-cost-to-maintain-an-app/](https://www.aalpha.net/articles/how-much-does-it-cost-to-maintain-an-app/)  
3. Clean Architecture in Flutter: Principles, Layers & Best Practices | LeanCode, дата последнего обращения: мая 12, 2026, [https://leancode.co/glossary/clean-architecture-in-flutter](https://leancode.co/glossary/clean-architecture-in-flutter)  
4. Clean Architecture in Flutter 2026 – Practical Implementation Guide \- YouTube, дата последнего обращения: мая 12, 2026, [https://m.youtube.com/watch?v=itShRNhyCN8](https://m.youtube.com/watch?v=itShRNhyCN8)  
5. Lessons On Flutter Clean Architecture After 2 years — My Thoughts | by Lion Silva \- Medium, дата последнего обращения: мая 12, 2026, [https://medium.com/h7w/lessons-on-flutter-clean-architecture-after-2-years-c5a2bced5e30](https://medium.com/h7w/lessons-on-flutter-clean-architecture-after-2-years-c5a2bced5e30)  
6. Data Localization Laws: Overview (Kazakhstan) \- Morgan Lewis, дата последнего обращения: мая 12, 2026, [https://www.morganlewis.com/-/media/files/publication/outside-publication/article/2024/data-localization-laws-overview-kazakhstan.pdf](https://www.morganlewis.com/-/media/files/publication/outside-publication/article/2024/data-localization-laws-overview-kazakhstan.pdf)  
7. Data protection compliance: an essential guide from Kazakhstan, Russia and Ukraine, дата последнего обращения: мая 12, 2026, [https://iuslaboris.com/insights/data-protection-compliance-an-essential-guide-from-kazakhstan-russia-and-ukraine/](https://iuslaboris.com/insights/data-protection-compliance-an-essential-guide-from-kazakhstan-russia-and-ukraine/)  
8. WebSockets vs. Firebase: which is best for real-time chat? \- ConnectyCube, дата последнего обращения: мая 12, 2026, [https://connectycube.com/2025/07/17/websockets-vs-firebase-which-is-best-for-real-time-chat/](https://connectycube.com/2025/07/17/websockets-vs-firebase-which-is-best-for-real-time-chat/)  
9. What solution do you use for apps that need websockets (e.g realtime GPS tracking or Discord WhatsApp) : r/webdev \- Reddit, дата последнего обращения: мая 12, 2026, [https://www.reddit.com/r/webdev/comments/r0bppo/what\_solution\_do\_you\_use\_for\_apps\_that\_need/](https://www.reddit.com/r/webdev/comments/r0bppo/what_solution_do_you_use_for_apps_that_need/)  
10. Managed Database Pricing \- PostgreSQL, MySQL, Kafka & More \- Pricing Calculator, дата последнего обращения: мая 12, 2026, [https://calculator.exoscale.com/database](https://calculator.exoscale.com/database)  
11. SMS Pricing in Kazakhstan for Text Messaging | Twilio, дата последнего обращения: мая 12, 2026, [https://www.twilio.com/en-us/sms/pricing/kz](https://www.twilio.com/en-us/sms/pricing/kz)  
12. SMS Messaging API Pricing \- Kazakhstan \- Plivo, дата последнего обращения: мая 12, 2026, [https://www.plivo.com/sms/pricing/kz/](https://www.plivo.com/sms/pricing/kz/)  
13. SMS messages price from €0.1916 \- Kazakhstan \- KZ \- BulkGate, дата последнего обращения: мая 12, 2026, [https://www.bulkgate.com/en/pricing/sms/kz/kazakhstan/](https://www.bulkgate.com/en/pricing/sms/kz/kazakhstan/)  
14. Our Super App \- About Kaspi.kz, дата последнего обращения: мая 12, 2026, [https://ir.kaspi.kz/about/mobile-app/](https://ir.kaspi.kz/about/mobile-app/)  
15. Not just a bank, but a super app \- Banking Frontiers, дата последнего обращения: мая 12, 2026, [https://bankingfrontiers.com/not-just-a-bank-but-a-super-app/](https://bankingfrontiers.com/not-just-a-bank-but-a-super-app/)  
16. Kaspi Pay API Integration Guide for Web and Mobile Apps (2026) \- Aunimeda Software, дата последнего обращения: мая 12, 2026, [https://aunimeda.com/blog/kaspi-pay-api-integration-guide](https://aunimeda.com/blog/kaspi-pay-api-integration-guide)  
17. How Does Kaspi.kz JSC Company Work? \- Matrix BCG, дата последнего обращения: мая 12, 2026, [https://matrixbcg.com/blogs/how-it-works/kaspi](https://matrixbcg.com/blogs/how-it-works/kaspi)  
18. ApiPay — Kaspi Pay payment gateway for Kazakhstan \- n8n Community, дата последнего обращения: мая 12, 2026, [https://community.n8n.io/t/apipay-kaspi-pay-payment-gateway-for-kazakhstan/282819](https://community.n8n.io/t/apipay-kaspi-pay-payment-gateway-for-kazakhstan/282819)  
19. Reccuring payment \- Freedom Pay, дата последнего обращения: мая 12, 2026, [https://docs.freedompay.kz/reccuring-payment-21166426e0](https://docs.freedompay.kz/reccuring-payment-21166426e0)  
20. Regular payments (autopayments): recurring payments Freedom Pay, дата последнего обращения: мая 12, 2026, [https://freedompay.kz/en/largebusiness/services/regular-payment-service](https://freedompay.kz/en/largebusiness/services/regular-payment-service)  
21. Mobile SDK Documentation, дата последнего обращения: мая 12, 2026, [https://epayment.kz/en-US/docs/mobile\_sdk\_documentation](https://epayment.kz/en-US/docs/mobile_sdk_documentation)  
22. Welcome to the EPAY Documentation, дата последнего обращения: мая 12, 2026, [https://epayment.kz/en-US/docs](https://epayment.kz/en-US/docs)  
23. CloudPayments-SDK-Android \- GitHub, дата последнего обращения: мая 12, 2026, [https://github.com/cloudpayments/CloudPayments-SDK-Android](https://github.com/cloudpayments/CloudPayments-SDK-Android)  
24. cloudpayments \- Dart API docs \- Pub.dev, дата последнего обращения: мая 12, 2026, [https://pub.dev/documentation/cloudpayments/latest/](https://pub.dev/documentation/cloudpayments/latest/)  
25. CloudPayments for Developers (English): Summary of changes, дата последнего обращения: мая 12, 2026, [https://developers.cloudpayments.ru/en/](https://developers.cloudpayments.ru/en/)  
26. How to Resolve App Store Guideline 3.1.1 – Business \> Payments \> In-App Purchase, дата последнего обращения: мая 12, 2026, [https://buddyboss.com/docs/app-store-guideline-3-1-1-business-payments-in-app-purchase/](https://buddyboss.com/docs/app-store-guideline-3-1-1-business-payments-in-app-purchase/)  
27. App Store Guidelines for Services Question : r/iOSProgramming \- Reddit, дата последнего обращения: мая 12, 2026, [https://www.reddit.com/r/iOSProgramming/comments/vdzszo/app\_store\_guidelines\_for\_services\_question/](https://www.reddit.com/r/iOSProgramming/comments/vdzszo/app_store_guidelines_for_services_question/)  
28. D-U-N-S® Number \- Membership \- Account \- Help \- Apple Developer, дата последнего обращения: мая 12, 2026, [https://developer.apple.com/help/account/membership/D-U-N-S/](https://developer.apple.com/help/account/membership/D-U-N-S/)  
29. How to obtain your Apple D-U-N-S Number effortlessly \- Median.co, дата последнего обращения: мая 12, 2026, [https://median.co/blog/what-is-a-d-u-n-s-number-how-to-get-one](https://median.co/blog/what-is-a-d-u-n-s-number-how-to-get-one)  
30. D-U-N-S NUMBER / Products / Interfax \- D\&B, дата последнего обращения: мая 12, 2026, [https://interfax-dnb.kz/en/products/d-u-n-s\_nomer/](https://interfax-dnb.kz/en/products/d-u-n-s_nomer/)  
31. Registration / Interfax \- D\&B \- Dnb.ru, дата последнего обращения: мая 12, 2026, [https://www.dnb.ru/en/registration/](https://www.dnb.ru/en/registration/)  
32. How to register Duns number for the Apple Developer Program (2026), дата последнего обращения: мая 12, 2026, [https://globallinkconsulting.sg/en/article/duns-registration/duns-for-apple-developer](https://globallinkconsulting.sg/en/article/duns-registration/duns-for-apple-developer)  
33. Data protection laws in Kazakhstan, дата последнего обращения: мая 12, 2026, [https://www.dlapiperdataprotection.com/index.html?t=law\&c=KZ](https://www.dlapiperdataprotection.com/index.html?t=law&c=KZ)  
34. PS Cloud Services. Облачный провайдер и регистратор доменов, дата последнего обращения: мая 12, 2026, [https://www.ps.kz/en](https://www.ps.kz/en)  
35. Best Web Hosting Review for PS.kz, дата последнего обращения: мая 12, 2026, [https://hostlecture.com/product/best-web-hosting-review-for-ps-kz/](https://hostlecture.com/product/best-web-hosting-review-for-ps-kz/)  
36. Personal Data Law: New Obligations for Companies \- Dentons, дата последнего обращения: мая 12, 2026, [https://www.dentons.com/en/insights/alerts/2022/february/25/personal-data-law-new-obligations-for-companies](https://www.dentons.com/en/insights/alerts/2022/february/25/personal-data-law-new-obligations-for-companies)  
37. Kazakhstan's Data Localization Rules Explained for Multinationals \- Esplora Legal, дата последнего обращения: мая 12, 2026, [https://esploralegal.com/kazakhstans-data-localization-rules-explained-for-multinationals/](https://esploralegal.com/kazakhstans-data-localization-rules-explained-for-multinationals/)  
38. Transfer of personal data in Kazakhstan \- Data Protection Laws of the World, дата последнего обращения: мая 12, 2026, [https://www.dlapiperdataprotection.com/?t=transfer\&c=KZ](https://www.dlapiperdataprotection.com/?t=transfer&c=KZ)  
39. On Personal Data and their Protection \- "Adilet" LIS \- Әділет, дата последнего обращения: мая 12, 2026, [https://adilet.zan.kz/eng/docs/Z1300000094](https://adilet.zan.kz/eng/docs/Z1300000094)  
40. Electronic digital signature in the Republic of Kazakhstan: legal status, types and procedure for obtaining, дата последнего обращения: мая 12, 2026, [https://matias-corp.com/en/electronic-digital-signature-in-the-republic-of-kazakhstan-legal-status-types-and-procedure-for-obtaining](https://matias-corp.com/en/electronic-digital-signature-in-the-republic-of-kazakhstan-legal-status-types-and-procedure-for-obtaining)  
41. Electronic invoicing in Kazakhstan | Obligation, EIIS platform and technical requirements, дата последнего обращения: мая 12, 2026, [https://edicomgroup.com/electronic-invoicing/kazakhstan](https://edicomgroup.com/electronic-invoicing/kazakhstan)  
42. E-Invoices from 2026: New Form and Rules Approved for Businesses in Kazakhstan, дата последнего обращения: мая 12, 2026, [https://acsour.kz/news\_eng/tpost/gavnozn5l1-e-invoices-from-2026-new-form-and-rules](https://acsour.kz/news_eng/tpost/gavnozn5l1-e-invoices-from-2026-new-form-and-rules)  
43. Obtaining Electronic Digital Signature (EDS) and Individual Identification Number (IIN), дата последнего обращения: мая 12, 2026, [https://www.gov.kz/memleket/entities/mfa-washington/press/article/details/223059?lang=en](https://www.gov.kz/memleket/entities/mfa-washington/press/article/details/223059?lang=en)  
44. Firebase vs WebSocket: Differences and how they work together \- Ably Realtime, дата последнего обращения: мая 12, 2026, [https://ably.com/topic/firebase-vs-websocket](https://ably.com/topic/firebase-vs-websocket)  
45. Scheduling on the Go: How a Mobile App Transforms Your Cleaning Management, дата последнего обращения: мая 12, 2026, [https://procleaneruk.co.uk/mobile-cleaning-scheduling-app/](https://procleaneruk.co.uk/mobile-cleaning-scheduling-app/)  
46. Firebase Cloud Messaging troubleshooting & FAQ \- Google, дата последнего обращения: мая 12, 2026, [https://firebase.google.com/docs/cloud-messaging/troubleshooting](https://firebase.google.com/docs/cloud-messaging/troubleshooting)  
47. Is firebase fcm really reliable for an app that completely wants to rely on incoming messages from server to work? \- Reddit, дата последнего обращения: мая 12, 2026, [https://www.reddit.com/r/Firebase/comments/1avq7fq/is\_firebase\_fcm\_really\_reliable\_for\_an\_app\_that/](https://www.reddit.com/r/Firebase/comments/1avq7fq/is_firebase_fcm_really_reliable_for_an_app_that/)  
48. Delay and non-delivery of messages with FCM on some networks · Issue \#307 · firebase/quickstart-android \- GitHub, дата последнего обращения: мая 12, 2026, [https://github.com/firebase/quickstart-android/issues/307](https://github.com/firebase/quickstart-android/issues/307)  
49. The Best Alternative to Pushwoosh \- OneSignal, дата последнего обращения: мая 12, 2026, [https://onesignal.com/onesignal-vs-pushwoosh](https://onesignal.com/onesignal-vs-pushwoosh)  
50. Pushwoosh vs OneSignal: comparison, features, and pricing, дата последнего обращения: мая 12, 2026, [https://www.pushwoosh.com/products/pushwoosh-vs-onesignal/](https://www.pushwoosh.com/products/pushwoosh-vs-onesignal/)  
51. FCM vs OneSignal vs Others : r/iOSProgramming \- Reddit, дата последнего обращения: мая 12, 2026, [https://www.reddit.com/r/iOSProgramming/comments/1l83xgt/fcm\_vs\_onesignal\_vs\_others/](https://www.reddit.com/r/iOSProgramming/comments/1l83xgt/fcm_vs_onesignal_vs_others/)  
52. Explore various Bitrix24 apps, дата последнего обращения: мая 12, 2026, [https://www.bitrix24.com/apps/](https://www.bitrix24.com/apps/)  
53. Integrations available for Bitrix24, дата последнего обращения: мая 12, 2026, [https://www.bitrix24.com/integrations/](https://www.bitrix24.com/integrations/)  
54. Task & Project Management Tools for Teams – Bitrix24, дата последнего обращения: мая 12, 2026, [https://www.bitrix24.com/features/tasks.php](https://www.bitrix24.com/features/tasks.php)  
55. Integration of messengers with Bitrix 24 in Kazakhstan, дата последнего обращения: мая 12, 2026, [https://chatapp24.kz/en/crm-integrations/bitrix24/](https://chatapp24.kz/en/crm-integrations/bitrix24/)  
56. Bitrix24 Market: Integration platforms Applications, дата последнего обращения: мая 12, 2026, [https://www.bitrix24.com/apps/category/integration\_platforms/](https://www.bitrix24.com/apps/category/integration_platforms/)  
57. Software Development Hourly Rate: World-Wide Comparison 2025, дата последнего обращения: мая 12, 2026, [https://devoxsoftware.com/blog/average-software-developer-hourly-rate/](https://devoxsoftware.com/blog/average-software-developer-hourly-rate/)  
58. Application Developer Salary in Kazakhstan (2026) \- ERI SalaryExpert, дата последнего обращения: мая 12, 2026, [https://www.salaryexpert.com/salary/job/application-developer/kazakhstan](https://www.salaryexpert.com/salary/job/application-developer/kazakhstan)  
59. Android Developer Salary in Kazakhstan (2026) \- ERI Economic Research Institute, дата последнего обращения: мая 12, 2026, [https://www.erieri.com/salary/job/android-developer/kazakhstan](https://www.erieri.com/salary/job/android-developer/kazakhstan)