import { prisma } from './prisma.client';
import { AuditLogService } from './audit-log.service';

export interface CreateCommentInput {
  content: string;
  parentId?: string; // For threaded comments
}

export interface Comment {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  createdAt: Date;
  updatedAt: Date;
  parentId?: string;
  replies?: Comment[];
}

export class CommentsService {
  /**
   * Get comments for an item
   */
  static async getComments(
    companyId: string,
    targetType: 'tool' | 'risk' | 'incident',
    targetId: string
  ): Promise<Comment[]> {
    // Get top-level comments
    const comments = await prisma.comment.findMany({
      where: {
        companyId,
        targetType: targetType.toUpperCase(),
        targetId,
        parentId: null, // Only top-level comments
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get replies for each comment
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await prisma.comment.findMany({
          where: {
            companyId,
            parentId: comment.id,
          },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        });

        return {
          id: comment.id,
          content: comment.content,
          author: comment.author,
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt,
          parentId: comment.parentId || undefined,
          replies: replies.map((r) => ({
            id: r.id,
            content: r.content,
            author: r.author,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
            parentId: r.parentId || undefined,
          })),
        };
      })
    );

    return commentsWithReplies;
  }

  /**
   * Create comment
   */
  static async createComment(
    companyId: string,
    actorId: string,
    targetType: 'tool' | 'risk' | 'incident',
    targetId: string,
    input: CreateCommentInput
  ): Promise<Comment> {
    const comment = await prisma.comment.create({
      data: {
        companyId,
        targetType: targetType.toUpperCase(),
        targetId,
        content: input.content,
        authorId: actorId,
        parentId: input.parentId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Log as audit event
    await AuditLogService.log({
      companyId,
      actorId,
      action: `${targetType}.comment`,
      targetType: targetType.charAt(0).toUpperCase() + targetType.slice(1),
      targetId,
      changes: { comment: input.content },
    });

    // Trigger webhook
    try {
      const { WebhooksService } = await import('./webhooks.service');
      await WebhooksService.triggerWebhook(companyId, `${targetType}.commented`, {
        targetType,
        targetId,
        commentId: comment.id,
      });
    } catch (error) {
      // Don't fail comment creation if webhook fails
    }

    return {
      id: comment.id,
      content: comment.content,
      author: comment.author,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      parentId: comment.parentId || undefined,
    };
  }

  /**
   * Delete comment
   */
  static async deleteComment(
    companyId: string,
    actorId: string,
    commentId: string
  ): Promise<void> {
    await prisma.comment.delete({
      where: {
        id: commentId,
        companyId,
        authorId: actorId, // Only author can delete
      },
    });
  }
}
