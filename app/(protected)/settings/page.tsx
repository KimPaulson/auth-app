'use client';

//import {auth, signOut} from '@/auth';
import {useSession, signOut} from 'next-auth/react';
import {useCurrentUser} from "@/hooks/use-current-user";

const SettingsPage = () => {
    const user = useCurrentUser();

    const onClick = () => {
        signOut();
    };

    return (
        <div className='bg-white p-10 rounded-xl'>
            <button onClick={onClick} typeof='submit'>
                Sign out
            </button>
        </div>
    );
};

export default SettingsPage;