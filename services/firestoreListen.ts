import {

  DocumentReference,

  DocumentSnapshot,

  FirestoreError,

  onSnapshot,

  Query,

  QuerySnapshot,

  Unsubscribe,

} from 'firebase/firestore';



function logListenerError(source: string, error: FirestoreError) {

  if (__DEV__) {

    console.warn(`[Firestore] ${source}:`, error.code, error.message);

  }

}



/** onSnapshot with an error handler so watch-stream failures do not crash the app. */

export function safeOnSnapshotDoc<T>(

  ref: DocumentReference<T>,

  onNext: (snapshot: DocumentSnapshot<T>) => void,

  source = 'doc',

): Unsubscribe {

  return onSnapshot(

    ref,

    onNext,

    (error) => logListenerError(source, error),

  );

}



export function safeOnSnapshotQuery<T>(

  ref: Query<T>,

  onNext: (snapshot: QuerySnapshot<T>) => void,

  source = 'query',

): Unsubscribe {

  return onSnapshot(

    ref,

    onNext,

    (error) => logListenerError(source, error),

  );

}


