import { Redirect } from 'expo-router';

export default function LogoutRedirect() {
    return <Redirect href={"/admin/" as any} />;
}
