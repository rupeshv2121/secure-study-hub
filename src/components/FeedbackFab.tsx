import FeedbackForm from '@/components/FeedbackForm';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { MessageCircle } from 'lucide-react';
import { useState } from 'react';

const FeedbackFab = () => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          aria-label="Open feedback chat"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-emerald-600 text-white px-4 py-3 rounded-full shadow-lg hover:bg-emerald-700 focus:outline-none"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="hidden sm:inline">Give feedback</span>
        </button>
      </DialogTrigger>

      <DialogContent className="right-4 top-auto left-auto bottom-4 translate-x-0 translate-y-0 w-[min(440px,calc(100vw-2rem))] h-[min(82vh,760px)] overflow-hidden p-0 rounded-3xl border-border/60 bg-background shadow-2xl">
        <div className="flex h-full flex-col">
          <DialogHeader className="border-b border-border/60 px-4 py-3 text-left">
            <DialogTitle>Send Feedback</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">We appreciate your thoughts — send feedback anytime.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden bg-gradient-to-b from-white/60 to-white/40">
            <FeedbackForm onSuccess={() => setOpen(true)} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackFab;
