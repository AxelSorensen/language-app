import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  QueryDocumentSnapshot,
  CollectionReference,
  DocumentReference,
  Query,
  QueryConstraint,
} from "firebase/firestore";
import { db } from "../../plugins/firebase.client";

export class FirestoreRepository<T extends Record<string, any>> {
  private collectionName: string;
  private collectionRef: CollectionReference<T>;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
    this.collectionRef = collection(
      db,
      collectionName
    ) as CollectionReference<T>;
  }

  /**
   * Add a new document (auto-generated ID)
   */
  async addDoc(data: Omit<T, "id">): Promise<string> {
    try {
      const docRef = await addDoc(this.collectionRef, data as T);
      return docRef.id;
    } catch (error) {
      console.error(`Error adding document to ${this.collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Set a document with a specific ID
   */
  async setDoc(id: string, data: Omit<T, "id">): Promise<void> {
    try {
      const docRef = doc(this.collectionRef, id);
      await setDoc(docRef, data as T);
    } catch (error) {
      console.error(
        `Error setting document ${id} in ${this.collectionName}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get a document by ID
   */
  async getById(id: string): Promise<T | null> {
    try {
      const docRef = doc(this.collectionRef, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as T;
      } else {
        return null;
      }
    } catch (error) {
      console.error(
        `Error getting document ${id} from ${this.collectionName}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get all documents in the collection
   */
  async getAll(): Promise<T[]> {
    try {
      const querySnapshot = await getDocs(this.collectionRef);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as T[];
    } catch (error) {
      console.error(
        `Error getting all documents from ${this.collectionName}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Update a document by ID
   */
  async update(id: string, data: Partial<T>): Promise<void> {
    try {
      const docRef = doc(this.collectionRef, id);
      await updateDoc(docRef, data);
    } catch (error) {
      console.error(
        `Error updating document ${id} in ${this.collectionName}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Delete a document by ID
   */
  async delete(id: string): Promise<void> {
    try {
      const docRef = doc(this.collectionRef, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error(
        `Error deleting document ${id} from ${this.collectionName}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Query documents with constraints
   */
  async query(constraints: QueryConstraint[]): Promise<T[]> {
    try {
      const q = query(this.collectionRef, ...constraints);
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as T[];
    } catch (error) {
      console.error(`Error querying ${this.collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Find documents by field value
   */
  async findByField(field: keyof T, value: any): Promise<T[]> {
    try {
      return await this.query([where(field as string, "==", value)]);
    } catch (error) {
      console.error(
        `Error finding documents by ${String(field)} in ${
          this.collectionName
        }:`,
        error
      );
      throw error;
    }
  }

  /**
   * Find first document by field value
   */
  async findOneByField(field: keyof T, value: any): Promise<T | null> {
    try {
      const results = await this.findByField(field, value);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error(
        `Error finding one document by ${String(field)} in ${
          this.collectionName
        }:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get documents with pagination
   */
  async getPaginated(
    pageSize: number = 10,
    lastDoc?: QueryDocumentSnapshot<T>,
    orderByField: keyof T = "createdAt" as keyof T,
    orderDirection: "asc" | "desc" = "desc"
  ): Promise<{
    data: T[];
    lastDoc: QueryDocumentSnapshot<T> | null;
    hasMore: boolean;
  }> {
    try {
      const constraints: QueryConstraint[] = [
        orderBy(orderByField as string, orderDirection),
        limit(pageSize),
      ];

      if (lastDoc) {
        constraints.push(startAfter(lastDoc));
      }

      const q = query(this.collectionRef, ...constraints);
      const querySnapshot = await getDocs(q);

      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as T[];

      const newLastDoc =
        querySnapshot.docs[querySnapshot.docs.length - 1] || null;
      const hasMore = querySnapshot.docs.length === pageSize;

      return { data, lastDoc: newLastDoc, hasMore };
    } catch (error) {
      console.error(
        `Error getting paginated data from ${this.collectionName}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Check if document exists
   */
  async exists(id: string): Promise<boolean> {
    try {
      const docRef = doc(this.collectionRef, id);
      const docSnap = await getDoc(docRef);
      return docSnap.exists();
    } catch (error) {
      console.error(
        `Error checking if document ${id} exists in ${this.collectionName}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get collection reference (useful for subcollections)
   */
  getCollectionRef(): CollectionReference<T> {
    return this.collectionRef;
  }

  /**
   * Get document reference
   */
  getDocRef(id: string): DocumentReference<T> {
    return doc(this.collectionRef, id);
  }
}
