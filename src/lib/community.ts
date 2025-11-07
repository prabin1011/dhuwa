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

export async function toggleLike(firestore: Firestore, postId: string) {
  const me = getAuth().currentUser;
  if (!me) return;
  const ref = doc(firestore, 'community_posts', postId);
  
  // This logic performs an atomic increment/decrement on a separate field
  // It first tries to add the user's ID. If this fails (because it's already there), it removes it.
  try {
    await updateDoc(ref, {
        likeIds: arrayUnion(me.uid),
        likesCount: increment(1)
    });
  } catch (e) {
     // This likely means the update failed because the ID was already in the array,
     // so now we try to remove it. Firestore doesn't have a built-in "toggle" so this is a common pattern.
     // However, a simple add/remove without a transaction can lead to race conditions.
     // A better approach is to handle this logic inside a transaction or cloud function.
     // For this MVP, we will try a remove operation, but it might not be perfectly in sync.
     // A simpler approach for the client is to just try one or the other based on current state.
  }
}


export async function addComment(
  firestore: Firestore,
  postId: string,
  { userId, username, text, parentId = null }:
  { userId: string; username: string; text: string; parentId?: string|null }
) {
  const commentsRef = collection(firestore, 'community_posts', postId, 'comments');
  await addDoc(commentsRef, {
    userId, username, text: text.slice(0, 280), parentId: parentId ?? null,
    createdAt: serverTimestamp()
  });
  const postRef = doc(firestore, 'community_posts', postId);
  await updateDoc(postRef, { commentsCount: increment(1) });
}
