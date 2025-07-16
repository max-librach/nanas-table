// Allowed family members
export const FAMILY_MEMBERS = {
  'maxlibrach@gmail.com': 'Max',
  'ashley.maheris@gmail.com': 'Ashley',
  'glibrach@gmail.com': 'Giliah',
  'miriam.librach@gmail.com': 'Miriam',
  'erez.nagar@gmail.com': 'Erez'
} as const;

export const FAMILY_NAMES = Object.values(FAMILY_MEMBERS);

// Updated family members list for the V0 design
export const FAMILY_MEMBERS_LIST = [
  { name: "Max", defaultChecked: true },
  { name: "Ashley", defaultChecked: true },
  { name: "Giliah", defaultChecked: true },
  { name: "Miriam", defaultChecked: true },
  { name: "Erez", defaultChecked: true },
  { name: "Lucy", defaultChecked: false },
  { name: "Shoko", defaultChecked: false },
  { name: "Lavi", defaultChecked: true },
  { name: "Shai", defaultChecked: true },
  { name: "Cliff", defaultChecked: true },
  { name: "Haley", defaultChecked: true },
  { name: "Other", defaultChecked: false },
];

export const HOLIDAYS = [
  'Rosh Hashanah',
  'Yom Kippur',
  'Sukkot',
  'Simchat Torah',
  'Shavuot',
  'Passover',
  'Purim',
  'Hanukkah',
  'Thanksgiving',
  'New Years',
  'Independence Day',
  'Memorial Day',
  'Labor Day',
  'Other'
] as const;