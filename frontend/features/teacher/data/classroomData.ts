export interface StudentRecord {
  id: string;
  name: string;
  rollNo: string;
  avatar: string;
  email: string;
  s3Score: number | null; // null means unattempted
  sgScore: number | null;
  iamScore: number | null;
  lastActive: string;
  status: 'completed' | 'in-progress' | 'needs-help' | 'unattempted';
  notes?: string;
  isCurrentUser?: boolean;
}

export interface MistakeInsight {
  missionId: string;
  missionName: string;
  service: string;
  issue: string;
  affectedPercentage: number;
  explanation: string;
  teachingRecommendation: string;
}

export const INITIAL_STUDENT_ROSTER: StudentRecord[] = [
  {
    id: 'st-01',
    name: 'Aarav Sharma',
    rollNo: 'CS23B01',
    avatar: '👨‍🎓',
    email: 'aarav.sharma@univ.edu',
    s3Score: 100,
    sgScore: 100,
    iamScore: 90,
    lastActive: '10 mins ago',
    status: 'completed',
    notes: 'Flawless S3 remediation; minor wildcard action overgrant in IAM',
  },
  {
    id: 'st-02',
    name: 'Priya Patel',
    rollNo: 'CS23B14',
    avatar: '👩‍🎓',
    email: 'priya.patel@univ.edu',
    s3Score: 100,
    sgScore: 95,
    iamScore: 100,
    lastActive: '25 mins ago',
    status: 'completed',
    notes: 'Excellent grasp of CIDR notation and IAM least-privilege',
  },
  {
    id: 'st-03',
    name: 'Marcus Johnson',
    rollNo: 'CS23B08',
    avatar: '👨‍🎓',
    email: 'marcus.j@univ.edu',
    s3Score: 65,
    sgScore: 50,
    iamScore: null,
    lastActive: '1 hour ago',
    status: 'needs-help',
    notes: 'Blocked HTTP port 80 accidentally; forgot to check S3 canned ACL',
  },
  {
    id: 'st-04',
    name: 'Sneha Kulkarni',
    rollNo: 'CS23B22',
    avatar: '👩‍🎓',
    email: 'sneha.k@univ.edu',
    s3Score: 100,
    sgScore: 70,
    iamScore: 100,
    lastActive: '3 hours ago',
    status: 'completed',
    notes: 'Security group rule took 3 attempts to configure correctly',
  },
  {
    id: 'st-05',
    name: 'Rohan Mehta',
    rollNo: 'CS23B33',
    avatar: '👨‍🎓',
    email: 'rohan.m@univ.edu',
    s3Score: 70,
    sgScore: null,
    iamScore: null,
    lastActive: 'Yesterday',
    status: 'in-progress',
    notes: 'Enabled Block Public Access but forgot to remove public policy statement',
  },
  {
    id: 'st-06',
    name: 'Sarah Chen',
    rollNo: 'CS23B05',
    avatar: '👩‍🎓',
    email: 'sarah.c@univ.edu',
    s3Score: 100,
    sgScore: 100,
    iamScore: 100,
    lastActive: 'Yesterday',
    status: 'completed',
    notes: 'Fastest completion in class (sub-12 minutes across all labs)',
  },
  {
    id: 'st-07',
    name: 'Devansh Verma',
    rollNo: 'CS23B19',
    avatar: '👨‍🎓',
    email: 'devansh.v@univ.edu',
    s3Score: 35,
    sgScore: 40,
    iamScore: null,
    lastActive: '2 days ago',
    status: 'needs-help',
    notes: 'Struggling with CIDR subnet ranges and IAM Action syntax',
  },
  {
    id: 'st-08',
    name: 'Ananya Gupta',
    rollNo: 'CS23B27',
    avatar: '👩‍🎓',
    email: 'ananya.g@univ.edu',
    s3Score: 100,
    sgScore: 85,
    iamScore: 90,
    lastActive: '2 days ago',
    status: 'completed',
    notes: 'Solid troubleshooting methodology',
  },
];

export const CLASS_MISTAKE_INSIGHTS: MistakeInsight[] = [
  {
    missionId: 's3-leaky-bucket',
    missionName: 'The Leaky Bucket',
    service: 'Amazon S3',
    issue: 'Forgot Bucket Canned ACL Verification',
    affectedPercentage: 62,
    explanation:
      'Students turned on Block Public Access (BPA) switches, but did not understand that legacy Object ACLs or Bucket ACLs can retain public read permissions if BPA is ever modified.',
    teachingRecommendation:
      'Emphasize the difference between S3 Bucket Policies and S3 Object Access Control Lists (ACLs) in your next lecture.',
  },
  {
    missionId: 'sg-door-open',
    missionName: 'Door Left Open',
    service: 'VPC Security Groups',
    issue: 'Accidentally Closed Web Traffic (Port 80/443)',
    affectedPercentage: 48,
    explanation:
      'When removing the open 0.0.0.0/0 SSH rule, students inadvertently deleted or modified legitimate HTTP (port 80) and HTTPS (port 443) rules, causing a simulated production outage.',
    teachingRecommendation:
      'Teach the concept of stateful ingress rule isolation—remediating administrative ports without disrupting public customer traffic.',
  },
  {
    missionId: 'iam-too-much-power',
    missionName: 'Too Much Power',
    service: 'AWS IAM',
    issue: 'Granted Wildcard Action ("Action": "*")',
    affectedPercentage: 71,
    explanation:
      'Students struggled to identify which specific S3 operations the application needed, defaulting to broad wildcards like s3:* instead of least-privilege s3:GetObject and s3:PutObject.',
    teachingRecommendation:
      'Run a 10-minute workshop on reading application error logs to deduce exact IAM permissions instead of guessing.',
  },
];
