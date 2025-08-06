// Website Content Configuration
// Please fill in all the TODO sections with your actual content

export const websiteContent = {
  // ============================================
  // KINDERGARTEN INFORMATION
  // ============================================
  kindergarten: {
    name: "BRK Haus für Kinder - Leuchtturm",
    shortName: "Leuchtturm",

    // TODO: Add your kindergarten description
    description:
      "Im Haus für Kinder „Leuchtturm“ in Mittersendling betreuen wir ingesamt 86 Kinder im Alter von acht Wochen bis zum Schuleintritt, davon 36 Kinder in der Krippe und 50 Kinder im Kindergarten. Im Mittelpunkt unserer pädagogischen Arbeit stehen sowohl die Begleitung und Unterstützung der kindlichen Entwicklung als auch die individuellen Bedürfnisse jedes einzelnen Kindes. Unsere Arbeit richtet sich nach den Vorgaben des Bayerischen Kinderbildungs- und -betreuungsgesetz (BayKiBiG) und des Bildungs- und Erziehungsplan (BEP), so dass die Kinder eine ganzheitliche Förderung in unserem Hause erfahren. Neben den pädagogischen Angeboten innerhalb der fünf Gruppen können die Kinder zudem in zahlreichen gruppenübergreifenden Projekten neue Erfahrungen sammeln.",

    // TODO: Add contact information
    contact: {
      email: "leuchtturm(at)brk-muenchen(dot)de",
      phone: "+49 89 45206860",
      address: {
        street: "Kürnbergstraße 17a",
        postalCode: "81369",
        city: "München",
        country: "Deutschland",
      },
    },
  },

  // ============================================
  // MAGAZINE INFORMATION
  // ============================================
  magazine: {
    // TODO: Update with actual magazine details
    title: "Flaschenpost",
    currentIssue: {
      issueNumber: "2024 / 2025",
      theme: "Kindergartenjahr 2024/2025",
      publicationDate: "August 2024",
      description:
        "Die Flaschenpost ist unser liebevoll gestaltetes Kindergarten-Magazin im handlichen A5-Format. Es erscheint regelmäßig und bietet allen Familien einen Einblick in das bunte Leben im BRK Haus für Kinder – Leuchtturm.",

      // Magazine content preview
      contents: [
        "Ein maritimes Titelbild im Stil unseres Leuchtturm-Namens",
        "Begrüßung und Einleitung mit persönlichen Worten unseres Teams",
        "Jede Gruppe stellt sich vor – mit: einem großen Gruppenfoto, Monatsrückblicken (Januar bis Juni) in kurzen Texten, passenden Fotos & Zitate",
        "Fotocollagen mit besonderen Momenten aus dem Kita-Alltag",
        "Jahresrückblick mit den Highlights des Kindergartenjahres",
        "Unsere Vorschulkinder – Vorstellung der Kinder, die nun in die Schule kommen",
        "Abschiedsseite vom Elternbeirat",
        "",
      ],

      // Number of pages
      pageCount: 44,

      // Physical specifications
      format: "DIN A5",
      paperWeight: "130g",
    },
  },

  // ============================================
  // PRICING (confirm these amounts)
  // ============================================
  pricing: {
    magazinePrice: 2.5, // TODO: Confirm price in EUR
    shippingCost: 1.8, // TODO: Confirm Versandkostenpauschale in EUR
    currency: "EUR",

    // Shipping details
    shippingMethod: "Deutsche Post Grossbrief",
    estimatedDeliveryDays: "3-5 Werktage nach Zahlungseingang",
  },

  // ============================================
  // HOMEPAGE CONTENT
  // ============================================
  homepage: {
    // Hero section
    hero: {
      // TODO: Update with your specific message
      headline: "Flaschenpost Magazin reservieren",
      subheadline:
        "Für alle Familien, die das Magazin nicht persönlich abholen können",

      // Call to action
      ctaText: "Jetzt Exemplar reservieren",

      // Additional info
      badge: "Limitierte Auflage",
    },

    // About section
    about: {
      title: "Warum dieser Service?",
      // TODO: Explain why families need shipping option
      description: `Für Familien, die den Kindergarten verlassen oder aus anderen Gründen 
                    das Magazin nicht persönlich abholen können, bieten wir einen Versandservice an.`,

      features: [
        {
          title: "Einfache Reservierung",
          description: "Reservieren Sie Ihr Exemplar in wenigen Schritten",
        },
        {
          title: "Sichere Zahlung",
          description: "Bezahlen Sie bequem per PayPal",
        },
        {
          title: "Schneller Versand",
          description: "TErhalten Sie das Magazin innerhalb weniger Tage",
        },
      ],
    },

    // Process section
    process: {
      title: "So funktioniert es",
      steps: [
        {
          number: "1",
          title: "Reservieren",
          description: "Füllen Sie das Formular mit Ihren Daten aus",
        },
        {
          number: "2",
          title: "Bezahlen",
          description:
            "Zahlen Sie den Gesamtbetrag per PayPal oder Überweisung",
        },
        {
          number: "3",
          title: "Erhalten",
          description: "Das Magazin wird nach Zahlungseingang versandt",
        },
      ],
    },
  },

  // ============================================
  // PAYMENT INFORMATION
  // ============================================
  payment: {
    // TODO: Add your actual PayPal information
    paypal: {
      username: "felixgeelhaar", // for PayPal.Me link
      email: "felix@felixgeelhaar.de",
    },

    // TODO: Add your actual bank account details
    bankTransfer: {
      accountHolder: "BRK Haus für Kinder - Leuchtturm",
      iban: "DE00 0000 0000 0000 0000 00", // TODO: Add real IBAN
      bic: "XXXXXXXXXX", // TODO: Add real BIC
      bankName: "TODO: Bank Name",

      // Payment reference format
      referencePrefix: "Flaschenpost-",

      // Payment deadline in days
      paymentDeadlineDays: 7,
    },
  },

  // ============================================
  // EMAIL CONFIGURATION
  // ============================================
  email: {
    // TODO: Update email settings
    senderName: "Kindergarten Leuchtturm",
    senderEmail: process.env.SMTP_FROM || "noreply@your-domain.de",
    replyToEmail: process.env.SMTP_FROM || "noreply@your-domain.de",

    // Email signature
    signature: {
      name: "Ihr Elternbeirat",
      role: "BRK Haus für Kinder - Leuchtturm",
    },

    // Email subjects
    subjects: {
      reservation: "Ihre Flaschenpost Magazin Reservierung",
      paymentReminder: "Zahlungserinnerung - Flaschenpost Magazin",
      shippingConfirmation: "Ihr Magazin wurde versandt",
    },
  },

  // ============================================
  // LEGAL PAGES
  // ============================================
  legal: {
    // TODO: Complete Impressum (required by German law)
    imprint: {
      organization: "Elternbeirat BRK Haus für Kinder - Leuchtturm",
      legalForm: "",

      responsible: {
        name: "Felix Geelhaar",
        role: "Elternbeiratsvorsitzender",
      },

      address: {
        street: "Oetztaler Straße 6A",
        postalCode: "81373",
        city: "München",
        country: "Deutschland",
      },

      contact: {
        phone: "",
        email: "felix@felixgeelhaar.de",
      },

      // Registration details if applicable
      registrationCourt: "",
      registrationNumber: "",
      taxId: "",

      // Supervisory authority
      supervisoryAuthority: "",
    },

    // Privacy officer (if applicable)
    privacyOfficer: {
      name: "",
      email: "",
    },
  },

  // ============================================
  // FORM LABELS AND HELP TEXTS
  // ============================================
  forms: {
    reservation: {
      title: "Magazin reservieren",
      subtitle: "Bitte füllen Sie alle Pflichtfelder aus",

      // Success messages
      successTitle: "Reservierung erfolgreich!",
      successMessage:
        "Sie erhalten in Kürze eine E-Mail mit den Zahlungsinformationen.",

      // Error messages
      errorTitle: "Fehler bei der Reservierung",
      errorMessage:
        "Bitte überprüfen Sie Ihre Eingaben und versuchen Sie es erneut.",
    },
  },

  // ============================================
  // FAQ (Optional but helpful)
  // ============================================
  faq: [
    {
      question: "Wer kann diesen Service nutzen?",
      answer:
        "Dieser Service ist für Familien gedacht, die bereits im Urlaub sind oder das Magazin nicht persönlich abholen können.",
    },
    {
      question: "Wie lange dauert der Versand?",
      answer:
        "Nach Zahlungseingang versenden wir sobald wie möglich. In der Regel dauert die Lieferung 3-5 Werktage.",
    },
    {
      question: "Kann ich mehrere Exemplare bestellen?",
      answer: "Pro Familie kann ein Exemplar reserviert werden.",
    },
    {
      question: "Was passiert wenn ich nicht rechtzeitig bezahle?",
      answer: "Die Reservierung verfällt nach 7 Tagen.",
    },
    {
      question: "An wen kann ich mich bei Fragen wenden?",
      answer:
        "Bei Fragen kontaktieren Sie uns unter leuchtturm-elternbeirat(at)gmail(dot)com.",
    },
  ],

  // ============================================
  // IMPORTANT DATES
  // ============================================
  dates: {
    // TODO: Set important dates
    reservationDeadline: "2025-08-20", // Last day to reserve
    magazineAvailableFrom: "2024-08-06", // When magazine is ready
    lastShippingDate: "2024-08-30", // Last day we ship
  },

  // ============================================
  // IMAGES (paths to your actual images)
  // ============================================
  images: {
    // TODO: Add paths to your actual images
    magazineCover: "/images/magazine-cover.jpg", // Upload actual cover
    kindergartenLogo: "/images/leuchtturm-logo-large.svg", // Large lighthouse logo
    heroImage: "/images/hero-image.jpg", // Upload actual hero image
  },
};

// Helper function to get formatted price
export function getFormattedPrice(amount: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

// Helper function to get total price
export function getTotalPrice(): number {
  return (
    websiteContent.pricing.magazinePrice + websiteContent.pricing.shippingCost
  );
}

// Export individual sections for easier imports
export const {
  kindergarten,
  magazine,
  pricing,
  homepage,
  payment,
  email,
  legal,
  forms,
  faq,
  dates,
  images,
} = websiteContent;
