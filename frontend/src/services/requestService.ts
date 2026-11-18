import { RequestItem } from '../types/request';
import { notificationService } from './notificationService';
import { lenderRecordService } from './lenderRecordService';
import { personRecordService } from './personRecordService';
import { userService } from './userService';
import { getUser } from '../storage/storage';

export const requestService = {
  getIncomingRequests: async (): Promise<RequestItem[]> => {
    return await fetchIncomingRequests();
  },

  getSentRequests: async (): Promise<RequestItem[]> => {
    return await fetchSentRequests();
  },

  getRequestDetails: async (recordType: string, recordId: number | string, notificationId?: number | string): Promise<RequestItem> => {
    const currentUser = await getUser();

    // If notification ID is available, get details from notification
    if (notificationId) {
      const detail = await notificationService.getNotificationDetails(String(notificationId));
      if (detail && detail.id) {
        return await formatNotificationDetailToRequest(detail, undefined, currentUser);
      }
    }

    // Otherwise fetch by record ID
    if (recordType === 'LENDER_RECORD') {
      const rec: any = await lenderRecordService.getLenderRecordById(String(recordId));
      const senderInfo = await resolveSenderInfo(rec, undefined, currentUser);
      return {
        ...rec,
        recordType: 'LENDER_RECORD',
        interestFrequency: 'Monthly',
        date: rec.receivedDate,
        name: senderInfo.name,
        sender: {
          name: senderInfo.name,
          userId: senderInfo.userId,
        },
      };
    } else {
      const rec: any = await personRecordService.getPersonRecordById(String(recordId));
      const senderInfo = await resolveSenderInfo(rec, undefined, currentUser);
      return {
        ...rec,
        recordType: 'PERSON_RECORD',
        interestFrequency: 'Monthly',
        date: rec.givenDate,
        name: senderInfo.name,
        sender: {
          name: senderInfo.name,
          userId: senderInfo.userId,
        },
      };
    }
  },

  acceptRequest: async (recordType: string, recordId: number | string): Promise<any> => {
    if (recordType === 'LENDER_RECORD') {
      return await lenderRecordService.acceptLenderRecord(String(recordId));
    } else {
      return await personRecordService.acceptPersonRecord(String(recordId));
    }
  },

  rejectRequest: async (recordType: string, recordId: number | string): Promise<any> => {
    if (recordType === 'LENDER_RECORD') {
      return await lenderRecordService.rejectLenderRecord(String(recordId));
    } else {
      return await personRecordService.rejectPersonRecord(String(recordId));
    }
  },

  completeRequest: async (recordType: string, recordId: number | string): Promise<any> => {
    if (recordType === 'LENDER_RECORD') {
      return await lenderRecordService.completeLenderRecord(String(recordId));
    } else {
      return await personRecordService.completePersonRecord(String(recordId));
    }
  },
};

// Robust resolution of actual sender name and userId without ever querying all users
export async function resolveSenderInfo(detail: any, n?: any, currentUser?: any): Promise<{ name: string; userId?: string }> {
  const directUserId = detail?.sender?.userId || n?.sender?.userId || detail?.owner?.userId;

  // 1. Check notes for embedded sender metadata: __SENDER__=FullName|UserId__ or _SENDER_=..._
  const rawNotes = detail?.notes || n?.notes || '';
  if (rawNotes && typeof rawNotes === 'string') {
    const senderTagMatch = rawNotes.match(/_{1,2}SENDER_{1,2}=\s*([^|\n]+?)\s*\|\s*([^_\s\n]+)\s*_{1,2}/);
    if (senderTagMatch) {
      const parsedName = senderTagMatch[1]?.trim();
      const parsedUserId = senderTagMatch[2]?.trim();
      if (parsedName) {
        return { name: parsedName, userId: parsedUserId || directUserId };
      }
    }
  }

  // 2. Direct sender on detail or notification
  const directName = detail?.sender?.name || detail?.sender?.fullName || n?.sender?.name || n?.sender?.fullName;
  if (directName && directName.toLowerCase() !== 'sender' && directName.toLowerCase() !== 'user') {
    return { name: directName.trim(), userId: directUserId || detail?.sender?.userId || n?.sender?.userId };
  }

  // 3. Record owner (if available on record)
  const ownerName = detail?.owner?.fullName || detail?.owner?.name || n?.owner?.fullName || n?.owner?.name;
  if (ownerName && ownerName.toLowerCase() !== 'sender' && ownerName.toLowerCase() !== 'user') {
    return { name: ownerName.trim(), userId: detail?.owner?.userId || n?.owner?.userId || directUserId };
  }

  // 4. Check notification title: "Payment Received from Ganesh Bobbali" or "Payment Request from Ganesh"
  if (n?.title && typeof n.title === 'string') {
    const fromIndex = n.title.toLowerCase().indexOf('from ');
    if (fromIndex !== -1) {
      const extracted = n.title.substring(fromIndex + 5).trim();
      const lower = extracted.toLowerCase();
      if (
        extracted.length > 0 &&
        lower !== 'lender' &&
        lower !== 'borrower' &&
        lower !== 'user' &&
        lower !== 'user a' &&
        (!currentUser?.fullName || lower !== currentUser.fullName.toLowerCase())
      ) {
        let resolvedUid = directUserId;
        if (!resolvedUid) {
          try {
            const foundUsers = await userService.searchUsersByName(extracted);
            const exact = foundUsers.find((u) => u.fullName?.toLowerCase() === lower);
            if (exact?.userId) resolvedUid = exact.userId;
          } catch {
            // ignore
          }
        }
        return { name: extracted, userId: resolvedUid };
      }
    }
  }

  // 5. Check notification message: "Ganesh Bobbali has sent you a notification..."
  if (n?.message && typeof n.message === 'string') {
    const hasSentIndex = n.message.toLowerCase().indexOf(' has sent you');
    if (hasSentIndex !== -1) {
      const extracted = n.message.substring(0, hasSentIndex).trim();
      const lower = extracted.toLowerCase();
      if (
        extracted.length > 0 &&
        lower !== 'user' &&
        lower !== 'user a' &&
        lower !== 'lender' &&
        lower !== 'borrower' &&
        (!currentUser?.fullName || lower !== currentUser.fullName.toLowerCase())
      ) {
        let resolvedUid = directUserId;
        if (!resolvedUid) {
          try {
            const foundUsers = await userService.searchUsersByName(extracted);
            const exact = foundUsers.find((u) => u.fullName?.toLowerCase() === lower);
            if (exact?.userId) resolvedUid = exact.userId;
          } catch {
            // ignore
          }
        }
        return { name: extracted, userId: resolvedUid };
      }
    }
  }

  // 6. Look up specific user by senderId or ownerId if available
  const senderId = n?.senderId || detail?.senderId || detail?.ownerId;
  if (senderId) {
    try {
      const user = await userService.searchUserById(senderId);
      if (user && user.fullName) {
        return { name: user.fullName.trim(), userId: user.userId };
      }
    } catch {
      // ignore
    }
  }

  // 7. If record.name is different from current user
  if (detail?.name && currentUser?.fullName && detail.name.toLowerCase() !== currentUser.fullName.toLowerCase()) {
    return { name: detail.name.trim(), userId: directUserId };
  }

  return { name: 'Sender', userId: directUserId };
}

async function formatNotificationDetailToRequest(detail: any, n?: any, currentUser?: any): Promise<RequestItem> {
  const isLender =
    detail.recordType === 'LENDER_RECORD' ||
    (n && n.lenderRecordId != null) ||
    (n && n.type && n.type.includes('LENDER'));

  const senderInfo = await resolveSenderInfo(detail, n, currentUser);
  const senderName = senderInfo.name;
  const senderUserId = senderInfo.userId;

  return {
    id: detail.id,
    notificationId: n?.id || detail.notificationId,
    recordType: isLender ? 'LENDER_RECORD' : 'PERSON_RECORD',
    amount: Number(detail.amount || 0),
    interestRate: Number(detail.interestRate || 0),
    interestFrequency: 'Monthly',
    name: senderName,
    phoneNumber: detail.phoneNumber,
    fatherName: detail.fatherName,
    village: detail.village,
    mandal: detail.mandal,
    district: detail.district,
    state: detail.state,
    country: detail.country,
    pincode: detail.pincode,
    date: detail.receivedDate || detail.givenDate,
    receivedDate: detail.receivedDate,
    givenDate: detail.givenDate,
    notes: detail.notes,
    paymentScreenshot: detail.paymentScreenshot,
    status: detail.status || 'PENDING',
    createdAt: n?.createdAt || detail.createdAt || new Date().toISOString(),
    updatedAt: n?.updatedAt || detail.updatedAt || new Date().toISOString(),
    sender: {
      name: senderName,
      userId: senderUserId,
    },
  };
}

async function fetchIncomingRequests(): Promise<RequestItem[]> {
  try {
    const [currentUser, notifications] = await Promise.all([
      getUser().catch(() => null),
      notificationService.getNotifications().catch(() => []),
    ]);
    if (!Array.isArray(notifications)) return [];

    // Filter only record request notifications
    const requestNotifications = notifications.filter(
      (n: any) =>
        n.personRecordId != null ||
        n.lenderRecordId != null ||
        (n.type && (n.type.includes('REQUEST') || n.type.includes('RECORD')))
    );

    const results = await Promise.allSettled(
      requestNotifications.map(async (n: any) => {
        try {
          const detail = await notificationService.getNotificationDetails(String(n.id));
          if (detail && detail.id) {
            return await formatNotificationDetailToRequest(detail, n, currentUser);
          }
        } catch {
          return null;
        }
        return null;
      })
    );

    const items: RequestItem[] = [];
    results.forEach((r) => {
      if (r.status === 'fulfilled' && r.value) {
        items.push(r.value);
      }
    });

    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    console.error('Error fetching incoming requests:', err);
    return [];
  }
}

async function fetchSentRequests(): Promise<RequestItem[]> {
  try {
    const currentUser = await getUser();

    const [lenders, persons] = await Promise.all([
      lenderRecordService.getLenderRecords().catch(() => []),
      personRecordService.getPersonRecords().catch(() => []),
    ]);

    const items: RequestItem[] = [];

    const isRecordSentByMe = (r: any): boolean => {
      // Must have a target user to be a sent request
      const hasTarget = r.targetUserId != null || r.targetUser != null;
      if (!hasTarget) return false;

      // If the current user is the target recipient, then this user DID NOT send it!
      const currentUserId = currentUser?.userId?.toUpperCase();
      const currentDbId = currentUser?.id;

      const recordTargetUserId = (r.targetUserId || r.targetUser?.userId || '').toString().toUpperCase();
      const recordTargetDbId = r.targetUser?.id;

      if (currentUserId && recordTargetUserId === currentUserId) {
        return false; // I am the recipient, not sender!
      }
      if (currentDbId && recordTargetDbId === currentDbId) {
        return false; // I am the recipient, not sender!
      }

      // If record has ownerId and doesn't match current user, not sent by me
      if (r.ownerId != null && currentDbId != null && r.ownerId !== currentDbId) {
        return false;
      }

      return true;
    };

    if (Array.isArray(lenders)) {
      lenders.filter(isRecordSentByMe).forEach((r: any) => {
        items.push({
          id: r.id,
          recordType: 'LENDER_RECORD',
          amount: Number(r.amount || 0),
          interestRate: Number(r.interestRate || 0),
          interestFrequency: 'Monthly',
          name: r.name,
          phoneNumber: r.phoneNumber,
          date: r.receivedDate,
          receivedDate: r.receivedDate,
          notes: r.notes,
          paymentScreenshot: r.paymentScreenshot,
          status: r.status || 'PENDING',
          createdAt: r.createdAt || new Date().toISOString(),
          updatedAt: r.updatedAt || new Date().toISOString(),
          recipient: {
            name: r.targetUser?.fullName || r.name,
            userId: r.targetUserId || r.targetUser?.userId,
          },
        });
      });
    }

    if (Array.isArray(persons)) {
      persons.filter(isRecordSentByMe).forEach((r: any) => {
        items.push({
          id: r.id,
          recordType: 'PERSON_RECORD',
          amount: Number(r.amount || 0),
          interestRate: Number(r.interestRate || 0),
          interestFrequency: 'Monthly',
          name: r.name,
          phoneNumber: r.phoneNumber,
          date: r.givenDate,
          givenDate: r.givenDate,
          notes: r.notes,
          paymentScreenshot: r.paymentScreenshot,
          status: r.status || 'PENDING',
          createdAt: r.createdAt || new Date().toISOString(),
          updatedAt: r.updatedAt || new Date().toISOString(),
          recipient: {
            name: r.targetUser?.fullName || r.name,
            userId: r.targetUserId || r.targetUser?.userId,
          },
        });
      });
    }

    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    console.error('Error fetching sent requests:', err);
    return [];
  }
}
