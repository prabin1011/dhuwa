import {
  addDoc, collection, doc, serverTimestamp, writeBatch, increment, Firestore, arrayRemove, arrayUnion,
} from 'firebase/firestore';

export async function createCommunityPost(
  firestore: Firestore,
  {
    userId, username, habit, activity, momentLabel
  }: { userId: string; username: string; habit: string; activity: string; momentLabel: string; }
) {
  const ref = collection(firestore, 'community_posts');
  await addDoc(ref, {
    userId, username, habit, activity, momentLabel,
    createdAt: serverTimestamp(),
    likeIds: [],
    likesCount: 0,
    commentsCount: 0
  });
}

export async function addComment(
  firestore: Firestore,
  postId: string,
  { userId, username, text, parentId = null }:
  { userId: string; username: string; text: string; parentId?: string | null }
) {
  const batch = writeBatch(firestore);

  const commentsCol = collection(firestore, 'community_posts', postId, 'comments');
  const commentRef = doc(commentsCol); // pre-generate id

  // 1) comment doc
  batch.set(commentRef, {
    userId,
    username,
    text: text.slice(0, 280),
    parentId,                 // can be null
    createdAt: serverTimestamp()
  });

  // 2) commenters marker (enforces one comment per user per post)
  const markerRef = doc(firestore, 'community_posts', postId, 'commenters', userId);
  batch.set(markerRef, { createdAt: serverTimestamp() });

  // 3) increment commentsCount on the post
  const postRef = doc(firestore, 'community_posts', postId);
  batch.update(postRef, { commentsCount: increment(1) });

  await batch.commit();
}
