export interface MetaphorGuide {
  missionId: string;
  simpleTitle: string;
  analogyTagline: string;
  analogyStory: string;
  objectMetaphor: {
    name: string;
    icon: string;
    description: string;
  };
  jargonDictionary: Array<{
    technicalTerm: string;
    plainEnglish: string;
    whyItMatters: string;
  }>;
  stepByStepPlaybook: Array<{
    stepNumber: number;
    actionTitle: string;
    simpleExplanation: string;
  }>;
  whyAwsBillingMatters: string;
}

export const MISSION_METAPHORS: Record<string, MetaphorGuide> = {
  's3-leaky-bucket': {
    missionId: 's3-leaky-bucket',
    simpleTitle: 'The Digital Storage Vault with an Unlocked Door',
    analogyTagline: 'Leaving a bank vault wide open on a busy public sidewalk',
    analogyStory:
      'Imagine your startup has a physical bank vault where all customer payment invoices are kept. Someone took off the heavy padlock and left the vault door swinging open to the street. Anyone walking past can glance inside and take copies of customer bank details! Your job is to engage the 4 heavy security deadbolts and make sure only bank employees have keys.',
    objectMetaphor: {
      name: 'Digital Storage Vault (Amazon S3)',
      icon: '🏦',
      description:
        'A virtual hard drive where files (PDFs, images, data) live in the cloud. It should always be locked by default unless you explicitly intend to host a public website.',
    },
    jargonDictionary: [
      {
        technicalTerm: 'S3 Bucket',
        plainEnglish: 'A virtual storage box or folder in the cloud',
        whyItMatters: 'Stores your company files, invoices, and databases.',
      },
      {
        technicalTerm: 'Block Public Access (BPA)',
        plainEnglish: '4 Master Deadbolts on the storage box',
        whyItMatters: 'Even if an employee makes a mistake, these 4 deadbolts physically block the public internet.',
      },
      {
        technicalTerm: 'Bucket Policy',
        plainEnglish: 'The written security rulebook on who is allowed in',
        whyItMatters: 'If this rulebook says "Principal: *", it means "anyone in the world can read files".',
      },
      {
        technicalTerm: 'Canned ACL (Access Control List)',
        plainEnglish: 'A sticky note on the door giving access permissions',
        whyItMatters: 'Setting this to "public-read" is like sticking a note that says "Welcome, help yourself!"',
      },
    ],
    stepByStepPlaybook: [
      {
        stepNumber: 1,
        actionTitle: 'Turn on all 4 Master Deadbolts',
        simpleExplanation:
          'Click "Enable All 4" under Block Public Access to close off any unauthorized internet access vectors.',
      },
      {
        stepNumber: 2,
        actionTitle: 'Fix the Security Rulebook',
        simpleExplanation:
          'Change the bucket policy so only the InvoiceApplicationBackendRole can access the files, not the whole world.',
      },
      {
        stepNumber: 3,
        actionTitle: 'Set Access Badge to Private',
        simpleExplanation:
          'Switch the Bucket Canned ACL dropdown to "private" so no legacy public access remains.',
      },
    ],
    whyAwsBillingMatters:
      'In real AWS, if your bucket is public, automated crawler bots can download terabytes of data, causing your university or startup to receive surprise multi-thousand dollar bandwidth bills! In CloudProof, this simulation is 100% free and safe.',
  },

  'sg-door-open': {
    missionId: 'sg-door-open',
    simpleTitle: 'The Campus Gatekeeper Who Left the Backdoor Open',
    analogyTagline: 'A security guard letting anyone on Earth into the server room',
    analogyStory:
      'Imagine your college has a server building. The campus security guard was told to let visitors view the public website on Port 80 (HTTP) and Port 443 (HTTPS). But during late-night debugging, someone propped open the master administrative command door (Port 22 SSH) and set the guest list to "Everyone on Earth (0.0.0.0/0)". Hackers and automated botnets are hammering the door right now! Your job is to tell the guard: "Only allow connections coming from our verified college campus network!"',
    objectMetaphor: {
      name: 'Network Gatekeeper (VPC Security Group)',
      icon: '🏰',
      description:
        'A virtual firewall guard standing in front of your server. It checks the IP address and port number of every incoming packet before deciding to open the gate.',
    },
    jargonDictionary: [
      {
        technicalTerm: 'Security Group',
        plainEnglish: 'A virtual security guard standing outside your server',
        whyItMatters: 'Decides who gets into your virtual computer and who gets turned away.',
      },
      {
        technicalTerm: 'Port 22 (SSH)',
        plainEnglish: 'The administrative master command door',
        whyItMatters: 'Anyone who logs into Port 22 gets complete terminal control of the server.',
      },
      {
        technicalTerm: '0.0.0.0/0 (CIDR)',
        plainEnglish: 'Literally all 4.3 billion devices on the entire internet',
        whyItMatters: 'Using 0.0.0.0/0 on Port 22 means bots in Russia, China, and anywhere else can attack your server.',
      },
      {
        technicalTerm: '198.51.100.0/24 (CIDR)',
        plainEnglish: 'Only computers on your college campus network',
        whyItMatters: 'Restricts admin access strictly to students and faculty inside the campus building.',
      },
      {
        technicalTerm: 'Ports 80 & 443',
        plainEnglish: 'The public front doors for browsing the website',
        whyItMatters: 'These must stay open to 0.0.0.0/0 so legitimate students can view the web app.',
      },
    ],
    stepByStepPlaybook: [
      {
        stepNumber: 1,
        actionTitle: 'Find the dangerous Port 22 rule',
        simpleExplanation:
          'Locate the SSH rule currently open to 0.0.0.0/0 (all internet users).',
      },
      {
        stepNumber: 2,
        actionTitle: 'Restrict it to your campus network',
        simpleExplanation:
          'Click the "Campus Network" preset or enter 198.51.100.0/24 as the source.',
      },
      {
        stepNumber: 3,
        actionTitle: 'Keep the website doors open',
        simpleExplanation:
          'Make sure you don’t accidentally delete Port 80 and Port 443 so visitors can still use the web app.',
      },
    ],
    whyAwsBillingMatters:
      'Leaving Port 22 open allows crypto-mining botnets to break in with brute-force passwords and spin up expensive GPU instances, racking up thousands of dollars on your AWS card. In CloudProof, you learn to secure the gate safely at zero cost.',
  },

  'iam-too-much-power': {
    missionId: 'iam-too-much-power',
    simpleTitle: 'The Intern Who Got the Master Skeleton Key',
    analogyTagline: 'Handing an intern a key that opens every safe, office, and vault in the company',
    analogyStory:
      'Imagine your company hired an automated software worker to file incoming invoices in a storage cabinet. But HR accidentally handed this worker a Master Skeleton Key ("Action": "*") that opens the CEO’s office, the employee payroll safe, and the building alarm controls! If an attacker compromises this worker, they can steal or delete the entire company. Your job is to take away the master skeleton key and replace it with a specific keycard that ONLY opens the invoice cabinet.',
    objectMetaphor: {
      name: 'Digital Keycard & ID Badge (AWS IAM)',
      icon: '🪪',
      description:
        'AWS Identity and Access Management acts like digital keycards. Each program or user gets a badge specifying exactly which rooms (resources) they can enter and what they can do (actions).',
    },
    jargonDictionary: [
      {
        technicalTerm: 'IAM Role',
        plainEnglish: 'A digital keycard badge given to software or servers',
        whyItMatters: 'Allows programs to do their job without hardcoding sensitive passwords.',
      },
      {
        technicalTerm: '"Action": "*"',
        plainEnglish: 'A Master Skeleton Key that does literally anything',
        whyItMatters: 'Can create new users, delete databases, stop servers, or download all data.',
      },
      {
        technicalTerm: '"Resource": "*"',
        plainEnglish: 'Every single object and room in the entire company',
        whyItMatters: 'Fails to restrict the software to its own assigned workplace.',
      },
      {
        technicalTerm: 'Least Privilege',
        plainEnglish: 'Giving someone ONLY the exact keys they need to do their job',
        whyItMatters: 'The #1 foundational principle of cybersecurity.',
      },
    ],
    stepByStepPlaybook: [
      {
        stepNumber: 1,
        actionTitle: 'Inspect the active keycard policy',
        simpleExplanation:
          'Notice how the policy currently grants "Action": "*" and "Resource": "*".',
      },
      {
        stepNumber: 2,
        actionTitle: 'Scope down the actions',
        simpleExplanation:
          'Replace the wildcard with the specific operations the invoice service needs: s3:GetObject, s3:PutObject, and s3:ListBucket.',
      },
      {
        stepNumber: 3,
        actionTitle: 'Scope down the resource',
        simpleExplanation:
          'Restrict the resource ARN to the specific invoice bucket arn:aws:s3:::fintech-customer-invoices-2026/*.',
      },
    ],
    whyAwsBillingMatters:
      'If an attacker steals an over-privileged IAM credential, they can deploy hundreds of high-end cloud servers to mine cryptocurrency, resulting in tens of thousands of dollars in damages within hours. Practicing least privilege here prevents real-world catastrophes.',
  },
};
