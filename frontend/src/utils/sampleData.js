// 120 Realistic Sample Student Records for instantaneous demo & testing
const firstNamesM = ["Kofi", "Kwame", "Yaw", "Kwaku", "Kwabena", "Kojo", "Emmanuel", "Samuel", "Michael", "Daniel", "Francis", "Joseph", "Isaac", "Bright", "Godwin"];
const firstNamesF = ["Ama", "Abena", "Akosua", "Yaa", "Afia", "Akua", "Grace", "Mercy", "Patience", "Priscilla", "Comfort", "Doris", "Esther", "Mary", "Faustina"];
const lastNames = ["Mensah", "Owusu", "Boateng", "Appiah", "Sarpong", "Agyemang", "Osei", "Asante", "Frimpong", "Ankrah", "Quaye", "Addison", "Kwarteng", "Boadu", "Darko", "Arthur", "Adjei", "Yeboah"];
const programmes = ["Science", "Arts", "Business", "Visual Arts", "Home Economics"];

export const generateSampleStudents = () => {
  const records = [];
  for (let i = 1; i <= 120; i++) {
    const isFemale = i % 2 === 0;
    const firstList = isFemale ? firstNamesF : firstNamesM;
    const fName = firstList[i % firstList.length];
    const lName = lastNames[(i * 3) % lastNames.length];
    const prog = programmes[(i * 2) % programmes.length];
    const score = Math.floor(50 + ((i * 17) % 48)); // 50 to 97

    records.push({
      "Student ID": `SHS-2026-${String(i).padStart(3, '0')}`,
      "Full Name": `${fName} ${lName}`,
      "Gender": isFemale ? "Female" : "Male",
      "Programme": prog,
      "Score": score
    });
  }

  return {
    file_id: "sample-students-cohort",
    filename: "SHS_Students_2026.xlsx",
    total_rows: 120,
    columns: ["Student ID", "Full Name", "Gender", "Programme", "Score"],
    preview: records.slice(0, 8),
    records: records, // all 120 records available for local grouping fallback!
    issues: ["All 120 records are clean and verified for grouping."],
    status: "ready"
  };
};
