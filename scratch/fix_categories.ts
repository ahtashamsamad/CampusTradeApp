import { db } from './src/config/firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

const fixCategories = async () => {
    console.log('Starting category migration...');
    try {
        const q = query(
            collection(db, 'listings'),
            where('category', '==', 'Electronics')
        );
        const snapshot = await getDocs(q);
        console.log(`Found ${snapshot.docs.length} listings with category "Electronics"`);
        
        const updatePromises = snapshot.docs.map((docSnap) => {
            console.log(`Updating listing ${docSnap.id}: ${docSnap.data().title}`);
            return updateDoc(doc(db, 'listings', docSnap.id), {
                category: 'Tech'
            });
        });
        
        await Promise.all(updatePromises);
        console.log('Categories fixed successfully!');
    } catch (error) {
        console.error('Error fixing categories:', error);
    }
};

fixCategories();
