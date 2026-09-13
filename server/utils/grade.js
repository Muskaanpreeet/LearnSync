// Single place that maps a percentage to a letter grade, so the scale
// only has to be changed in one spot if the institution's grading
// policy changes.
const GRADE_SCALE = [
  { min: 90, grade: 'A+' },
  { min: 80, grade: 'A' },
  { min: 70, grade: 'B+' },
  { min: 60, grade: 'B' },
  { min: 50, grade: 'C' },
  { min: 40, grade: 'D' },
  { min: 0, grade: 'F' },
];

const percentageToGrade = (percentage) => {
  const band = GRADE_SCALE.find((b) => percentage >= b.min);
  return band ? band.grade : 'F';
};

module.exports = { percentageToGrade };
