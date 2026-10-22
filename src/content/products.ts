export interface Product {
  id: string
  name: string
  slug: string
  tagline: string
  /** Search title for a released product page; at most 60 characters. */
  seoTitle: string
  shortDescription: string
  description: string
  heroBadge: string
  /** Last content change (YYYY-MM-DD); the sitemap `lastmod`. */
  updatedAt: string
  /** Release state. Only `available` products may be presented as purchasable today. */
  status: 'available' | 'coming-soon'
  features: {
    title: string
    description: string
    icon: string
  }[]
  supportedOS: string[]
  specs: {
    category: string
    /** One line under the category title, e.g. who the group applies to. */
    note?: string
    items: { label: string; value: string }[]
  }[]
  relatedUseCases: { title: string; slug: string }[]
  pairedProducts: { name: string; slug: string; reason: string }[]
  faq: { question: string; answer: string }[]
}

/**
 * One-sentence positioning per product, from PROJECT_PROMPT.md §4. Used on the
 * home page lineup and on coming-soon product pages.
 */
export const PRODUCT_ONE_LINERS: Record<string, string> = {
  cms: 'Cloud content management for advertising screens.',
  pos: 'Point-of-sale linked to menu boards and promotions on screen.',
  tracking: 'Screen health, proof-of-play reports and campaign dashboards.',
  nfc: 'Tap-to-interact for screens and kiosks, with every tap measured.',
}

export const PRODUCTS: Product[] = [
  {
    id: 'cms',
    updatedAt: '2026-10-22',
    status: 'available',
    name: 'Viewixsoft CMS',
    slug: 'cms',
    tagline: 'Enterprise Cloud Content Management for Advertising Screens',
    seoTitle: 'Viewixsoft CMS: Cloud Digital Signage Software',
    shortDescription: 'Upload media, build dynamic multi-zone playlists, schedule by time and geolocation, and orchestrate thousands of screens remotely in real time.',
    heroBadge: 'Core Network Engine',
    description: 'Viewixsoft CMS is a cloud platform for managing content on advertising screens in retail chains, restaurants, offices and digital out-of-home (DOOH) networks. It gives marketing teams full visual composition control while providing IT administrators with granular role-based permissions, offline playback resilience, and remote device commands.',
    features: [
      {
        title: 'Multi-Zone Layout Builder',
        description: 'Drag and drop video widgets, live news tickers, RSS feeds, QR codes, weather broadcasts, and social feeds onto canvas zones.',
        icon: 'LayoutGrid'
      },
      {
        title: 'Precision Time & Geo Scheduling',
        description: 'Target specific screens by store location, dayparting, sensor triggers, or real-time inventory levels with automated blackout handling.',
        icon: 'CalendarClock'
      },
      {
        title: 'Offline Playback Resilience',
        description: 'Content caches locally on hardware players. Displays never go black even during prolonged network or internet disconnections.',
        icon: 'ShieldCheck'
      },
      {
        title: 'Mass Deployment & Grouping',
        description: 'Group screens dynamically by city, store category, or display aspect ratio. Push global campaign updates in under 3 seconds.',
        icon: 'Layers'
      }
    ],
    supportedOS: ['Android 11+'],
    // Confirmed by the product owner: video/image formats, player OS, chipsets,
    // memory and resolutions. TODO(content): audio, web and documents, player
    // network and the self-hosted server rows are still drafts; confirm before launch.
    specs: [
      {
        category: 'Supported media formats',
        items: [
          { label: 'Video', value: 'MP4, MOV (H.264)' },
          { label: 'Images', value: 'JPG, PNG, WebP, GIF' },
          { label: 'Audio', value: 'MP3, AAC, WAV' },
          { label: 'Web and documents', value: 'Web pages (URL), HTML5, PDF' },
          { label: 'Resolution', value: 'Full HD (1920 × 1080) and 4K UHD (3840 × 2160)' },
        ],
      },
      {
        category: 'Player devices and operating systems',
        items: [
          { label: 'Operating system', value: 'Android 11 or later' },
          { label: 'Chipsets', value: 'Rockchip RK3566, RK3576, RK3588' },
          { label: 'Memory', value: '2 GB RAM and 32 GB storage minimum' },
          { label: 'Network', value: 'Wi-Fi or Ethernet; plays cached content when offline' },
        ],
      },
      {
        category: 'Screen resolutions',
        items: [
          { label: '16:9 landscape', value: '1920 × 1080 (Full HD), 3840 × 2160 (4K UHD)' },
          { label: '9:16 portrait', value: '1080 × 1920 (Full HD), 2160 × 3840 (4K UHD)' },
        ],
      },
      {
        category: 'Self-hosted server',
        note: 'For customers who run Viewixsoft CMS on their own server instead of the cloud.',
        items: [
          { label: 'CPU', value: 'Intel Core i5 12th gen or Intel Xeon E-2300 series or newer (4 cores / 8 threads)' },
          { label: 'RAM', value: '16 GB minimum, 32 GB recommended for large networks' },
          { label: 'Storage', value: '512 GB NVMe SSD, plus space for your media library' },
          { label: 'Server OS', value: 'Ubuntu Server 22.04 LTS' },
          { label: 'Network', value: 'Static IP, HTTPS (port 443) open to your screens' },
        ],
      },
    ],
    relatedUseCases: [
      { title: 'DOOH Billboard Networks', slug: 'dooh-advertising' },
      { title: 'Retail In-Store Displays', slug: 'retail' }
    ],
    pairedProducts: [
      { name: 'Viewixsoft Tracking', slug: 'tracking', reason: 'Audit campaign delivery with certified proof-of-play and device health telemetry.' }
    ],
    faq: [
      {
        question: 'What happens to my screens if the internet connection drops?',
        answer: 'Viewixsoft CMS utilizes an intelligent client caching engine. Media and playlists are stored locally on the hardware player. In the event of network disruption, playback continues uninterrupted according to the existing schedule, and logs sync automatically upon reconnection.'
      },
      {
        question: 'Can I control screen brightness and power state remotely?',
        // TODO(content): confirm which power and brightness controls Android 11+ players support.
        answer: 'Yes. On supported Android 11+ players, Viewixsoft CMS lets you schedule when screens sleep and wake.'
      },
      {
        question: 'Does Viewixsoft CMS support video walls?',
        answer: 'Yes, Viewixsoft CMS natively handles multi-display video wall synchronization, bezel compensation, and synchronized canvas mapping across multiple output cards.'
      }
    ]
  },
  {
    id: 'pos',
    updatedAt: '2026-10-22',
    status: 'coming-soon',
    name: 'Viewixsoft POS',
    slug: 'pos',
    tagline: 'Synchronized Point-of-Sale & Dynamic Screen Intelligence',
    seoTitle: 'Viewixsoft POS: POS-Linked Digital Menu Boards',
    shortDescription: 'Unify sales, order processing, and dynamic digital menu boards. Automatically update menu items, prices, and promotional banners in real time.',
    heroBadge: 'Smart Commerce & Menus',
    description: 'Viewixsoft POS bridges the gap between transactions and visual merchandising. When menu prices update or an item sells out in the POS system, your digital menu boards, drive-thru displays, and promotional video kiosks update instantaneously—eliminating discrepancies and manual labor.',
    features: [
      {
        title: 'Instant Price & Item Sync',
        description: 'Update pricing, calories, and combo deals across your entire restaurant or retail chain in a single click.',
        icon: 'RefreshCw'
      },
      {
        title: 'Automated 86 (Sold-Out) Triggers',
        description: 'When inventory drops to zero, dishes or products automatically fade or switch to high-margin alternative recommendations.',
        icon: 'AlertCircle'
      },
      {
        title: 'Dynamic Daypart Menu Swapping',
        description: 'Smoothly transition from Breakfast to Lunch, Happy Hour, and Dinner menus based on precise scheduled timestamps.',
        icon: 'Clock'
      },
      {
        title: 'Kitchen & Order Status Screens',
        description: 'Render customer-facing order queue displays with audio chimes and ticket status alerts directly from kitchen printers or KDS.',
        icon: 'Monitor'
      }
    ],
    supportedOS: ['Android Tablets/Terminals', 'Windows POS Terminals', 'iPadOS (Companion)', 'Elo Touch Touchscreens'],
    specs: [
      {
        category: 'POS Integrations',
        items: [
          { label: 'Protocols Supported', value: 'Direct Webhook, REST API, Square, Toast, Clover, Micros Simphony, Lightspeed' },
          { label: 'Latency', value: '< 250ms synchronization across on-premise displays' },
          { label: 'Offline Mode', value: 'Local database SQLite failover with auto-reconciliation' }
        ]
      },
      {
        category: 'Hardware Peripherals',
        items: [
          { label: 'Printing', value: 'ESC/POS thermal printers (Ethernet, Bluetooth, USB)' },
          { label: 'Cash Drawers & Scanners', value: 'RJ11 drawer kick, 2D barcode/QR laser scanners' },
          { label: 'Payment Terminals', value: 'Stripe Terminal, Pax, Ingenico, Verifone' }
        ]
      }
    ],
    relatedUseCases: [
      { title: 'QSR & Restaurant Menu Boards', slug: 'qsr-menu-boards' },
      { title: 'Retail In-Store Displays', slug: 'retail' }
    ],
    pairedProducts: [
      { name: 'Viewixsoft NFC', slug: 'nfc', reason: 'Allow shoppers to tap their phone on the menu board or checkout kiosk to redeem coupons instantly.' }
    ],
    faq: [
      {
        question: 'Can Viewixsoft POS integrate with my existing POS provider?',
        answer: 'Yes. Viewixsoft POS can run as an all-in-one standalone POS or act as a digital screen synchronization bridge that listens to webhooks and inventory APIs from major systems like Toast, Square, and Clover.'
      },
      {
        question: 'How quickly do sold-out items disappear from menu screens?',
        answer: 'Items update across all screens in less than 500 milliseconds. You can choose whether to display a discreet "Sold Out" badge or completely replace the item with a featured promotion.'
      }
    ]
  },
  {
    id: 'tracking',
    updatedAt: '2026-10-22',
    status: 'coming-soon',
    name: 'Viewixsoft Tracking',
    slug: 'tracking',
    tagline: 'Real-Time Screen Telemetry, Proof-of-Play & Audience Analytics',
    seoTitle: 'Viewixsoft Tracking: Screen Monitoring and Proof-of-Play',
    shortDescription: 'Audit device uptime, generate cryptographic proof-of-play reports for brand advertisers, and measure viewer dwell time with AI edge computer vision.',
    heroBadge: 'Audit & Telemetry',
    description: 'Viewixsoft Tracking will show what played on each screen and whether every screen is healthy. Generate tamper-proof playback logs verified down to the second, monitor player hardware temperatures and network health, and measure anonymized audience impressions without violating viewer privacy.',
    features: [
      {
        title: 'Certified Proof-of-Play',
        description: 'Export granular, time-stamped proof-of-play certificates for media buyers and advertisers with 100% auditable accuracy.',
        icon: 'FileCheck'
      },
      {
        title: 'Device Health & Predictive Alerts',
        description: 'Track CPU temperature, storage wear, frame drop rates, and screen on/off signals. Receive instant Slack/email alerts before failures occur.',
        icon: 'Activity'
      },
      {
        title: 'Privacy-Compliant Audience Vision',
        description: 'Edge-computed camera telemetry calculates impressions, gaze duration, and demographics without storing biometric footage or facial images.',
        icon: 'Eye'
      },
      {
        title: 'Advertiser Client Portal',
        description: 'Provide advertising clients with white-label, self-service dashboard logins to monitor campaign pacing in real time.',
        icon: 'BarChart3'
      }
    ],
    supportedOS: ['Linux (Ubuntu/Yocto)', 'Android Edge Devices', 'Windows IoT Enterprise', 'Nvidia Jetson (AI Vision)'],
    specs: [
      {
        category: 'Telemetry & Verification',
        items: [
          { label: 'Reporting Resolution', value: '1-second granularity timestamping with cryptographic hashing' },
          { label: 'Uptime Monitoring', value: '30-second heartbeat check with automatic watchdog reboot' },
          { label: 'Compliance', value: 'GDPR and CCPA compliant anonymized edge processing' }
        ]
      },
      {
        category: 'Reporting & Integrations',
        items: [
          { label: 'Export Formats', value: 'CSV, Excel, Automated PDF, REST API, BigQuery / Snowflake sync' },
          { label: 'Alerting Channels', value: 'Email, SMS, Webhook, Slack, PagerDuty, OpsGenie' }
        ]
      }
    ],
    relatedUseCases: [
      { title: 'DOOH Billboard Networks', slug: 'dooh-advertising' },
      { title: 'Transportation Hubs', slug: 'transportation' }
    ],
    pairedProducts: [
      { name: 'Viewixsoft CMS', slug: 'cms', reason: 'Directly embed verified tracking metrics into your CMS scheduling and revenue optimization engine.' }
    ],
    faq: [
      {
        question: 'Does Viewixsoft Tracking store camera footage of viewers?',
        answer: 'No. Our audience telemetry utilizes privacy-by-design edge processing. Visual inputs are transformed instantly into mathematical vectors (dwell time, count) in volatile memory and immediately discarded. No video or facial pictures are ever saved or transmitted.'
      },
      {
        question: 'How do advertisers verify the proof-of-play reports?',
        answer: 'Every ad broadcast record contains a SHA-256 cryptographic hash combining the player ID, media checksum, timestamp, and hardware frame delivery confirmation, providing tamper-evident audit trails.'
      }
    ]
  },
  {
    id: 'nfc',
    updatedAt: '2026-10-22',
    status: 'coming-soon',
    name: 'Viewixsoft NFC',
    slug: 'nfc',
    tagline: 'Interactive Tap-to-Engage for Screens, Billboards & Kiosks',
    seoTitle: 'Viewixsoft NFC: Tap-to-Interact for Screens and Kiosks',
    shortDescription: 'Turn static signage into active customer conversions. Let visitors tap their smartphones against screens to open deals, order, or join loyalty programs.',
    heroBadge: 'Mobile-Screen Bridge',
    description: 'Viewixsoft NFC closes the physical-to-digital loop. By embedding smart NFC touchpoints and dynamic URL beacons into digital kiosks, bus shelters, and storefront screens, brands enable frictionless customer interaction without requiring app downloads.',
    features: [
      {
        title: 'App-Free Instant Action',
        description: 'Customers tap any iOS or Android phone to immediately launch digital coupons, product specifications, AR experiences, or payment links.',
        icon: 'Smartphone'
      },
      {
        title: 'Contextual Screen Sync',
        description: 'Coordinate screen playback with the mobile phone: tapping the screen shifts the billboard to display personalized greeting content.',
        icon: 'Zap'
      },
      {
        title: 'Conversion Attribution Funnel',
        description: 'Track the exact physical location, screen ID, creative variant, and time of every tap leading to an online or in-store purchase.',
        icon: 'TrendingUp'
      },
      {
        title: 'Dynamic Remote Reprogramming',
        description: 'Change the destination URL or campaign logic of thousands of physical NFC tags remotely from the cloud without touching hardware.',
        icon: 'Radio'
      }
    ],
    supportedOS: ['Standalone Cloud Gateway', 'Integrated with Viewixsoft CMS', 'Compatible with all NTAG213/215/216 hardware'],
    specs: [
      {
        category: 'Interaction Specs',
        items: [
          { label: 'Compatibility', value: '100% of modern Apple iPhones (XS and newer) and Android smartphones' },
          { label: 'Trigger Distance', value: '1 - 4 cm optimized proximity threshold' },
          { label: 'Security', value: 'Dynamic rolling URL tokens (AES-128) to prevent tag spoofing' }
        ]
      },
      {
        category: 'Analytics & Attribution',
        items: [
          { label: 'Attribution Parameters', value: 'UTM pass-through, hardware ID, creative ID, geographic coordinates' },
          { label: 'Webhook Speed', value: '< 100ms trigger delivery to CRM or customer phone' }
        ]
      }
    ],
    relatedUseCases: [
      { title: 'Retail In-Store Displays', slug: 'retail' },
      { title: 'Hospitality & Guest Experience', slug: 'hospitality' }
    ],
    pairedProducts: [
      { name: 'Viewixsoft POS', slug: 'pos', reason: 'Allow shoppers to tap a promo screen and carry their checkout cart straight to the POS register.' }
    ],
    faq: [
      {
        question: 'Do customers need to download a special app to tap?',
        answer: 'No app is required. Modern iOS and Android devices natively read NFC tags in background mode. Tapping immediately displays a native mobile sheet or browser notification.'
      },
      {
        question: 'Can someone copy or clone the physical NFC tag on a public billboard?',
        answer: 'Viewixsoft NFC supports dynamic encrypted cryptographic mirroring (SUN / CMAC). Each tap generates a single-use authentication token that expires immediately, making cloning impossible.'
      }
    ]
  }
]
