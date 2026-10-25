import prisma from '../src/config/database';

async function main() {
  const users = await prisma.user.findMany({ select: { id: true, email: true } });
  const ids = users.map((u) => u.id);
  const r = {
    quizAttempts: (await prisma.quizAttempt.deleteMany({ where: { userId: { in: ids } } })).count,
    quizQuestions: (await prisma.quizQuestion.deleteMany({})).count,
    flashcards: (await prisma.flashcard.deleteMany({})).count,
    summaries: (await prisma.summary.deleteMany({})).count,
    documents: (await prisma.document.deleteMany({})).count,
    history: (await prisma.studyHistory.deleteMany({})).count,
  };
  console.log('Cleaned:', JSON.stringify(r));
}
main().finally(() => prisma.$disconnect());
