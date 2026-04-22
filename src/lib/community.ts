
'use client';
import {
  addDoc, collection, serverTimestamp, Firestore,
  doc, updateDoc, arrayUnion, arrayRemove, increment,
} from 'firebase/firestore';

export async function createCommunityPost(
  firestore: Firestore,
  {
    userId, username, habit, activity, momentLabel
  }: { userId: string; username: string; habit: string; activity: string; momentLabel: string; }
) {
  const ref = collection(firestore, 'community_posts');
  await addDoc(ref, {
    userId,
    username,
    habit,
    activity,
    momentLabel,
    createdAt: serverTimestamp(),
    likesCount: 0,
    commentsCount: 0,
    likeIds: [],
  });
}

export async function togglePostLike(
  firestore: Firestore,
  postId: string,
  userId: string,
  currentlyLiked: boolean,
) {
  const ref = doc(firestore, 'community_posts', postId);
  if (currentlyLiked) {
    await updateDoc(ref, {
      likeIds: arrayRemove(userId),
      likesCount: increment(-1),
    });
  } else {
    await updateDoc(ref, {
      likeIds: arrayUnion(userId),
      likesCount: increment(1),
    });
  }
}
