import {Baskervville} from 'next/font/google';
import {cn} from '@/lib/utils';
import {Button} from '@/components/ui/button';
import {LoginButton} from "@/components/auth/login-button";

const font = Baskervville({
    subsets: ['latin'],
    weight: ['400'],
})

export default function Home() {
  return (
      <main className='flex h-full flex-col items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-300 to-blue-800'>
          <div className='space-y-6 text-center'>
              <h1 className={cn(
                  'text-6xl font-semibold text-zinc-800 drop-shadow-md',
                  font.className,
                  )}>
                  🔐 Auth
              </h1>
              <p className='text-zinc-800 text-lg'>
                  A simple authentication service
              </p>
              <div>
                  <LoginButton>
                      <Button variant='secondary' size='lg'>
                          Sign in
                      </Button>
                  </LoginButton>
              </div>
          </div>
      </main>
  );
}
