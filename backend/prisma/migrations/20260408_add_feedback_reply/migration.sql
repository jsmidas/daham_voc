-- CreateTable
CREATE TABLE "FeedbackReply" (
    "id" TEXT NOT NULL,
    "feedbackId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "FeedbackReply_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FeedbackReply_feedbackId_idx" ON "FeedbackReply"("feedbackId");
CREATE INDEX "FeedbackReply_authorId_idx" ON "FeedbackReply"("authorId");

-- AddForeignKey
ALTER TABLE "FeedbackReply" ADD CONSTRAINT "FeedbackReply_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "CustomerFeedback"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FeedbackReply" ADD CONSTRAINT "FeedbackReply_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
