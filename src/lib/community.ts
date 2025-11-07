import { addDoc, arrayRemove, arrayUnion, collection, doc, serverTimestamp, updateDoc, increment } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';

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
  const commentsRef = collection(firestore, 'community_posts', postId, 'comments');
  await addDoc(commentsRef, {
    userId,
    username,
    text: text.slice(0, 280),
    parentId,                   // always present (can be null)
    createdAt: serverTimestamp()
  });
  await updateDoc(doc(firestore, 'community_posts', postId), {
    commentsCount: increment(1)
  });
}
