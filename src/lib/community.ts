import {
  addDoc, collection, doc, serverTimestamp, updateDoc, increment, Firestore,
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
  const commentsCol = collection(firestore, 'community_posts', postId, 'comments');

  // 1. Add the comment document
  await addDoc(commentsCol, {
    userId,
    username,
    text: text.slice(0, 280),
    parentId,
    createdAt: serverTimestamp()
  });

  // 2. Increment the commentsCount on the parent post
  const postRef = doc(firestore, 'community_posts', postId);
  await updateDoc(postRef, {
    commentsCount: increment(1)
  });
}
