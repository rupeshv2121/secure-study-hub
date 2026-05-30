import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';

const faqs = [
  {
    question: 'How do students access the notes and lectures?',
    answer:
      'Students can browse subjects after sign-in and access the materials they are entitled to. Premium content is protected through the platform flow and secure viewer.',
  },
  {
    question: 'Can I leave feedback from the website?',
    answer:
      'Yes. The floating Give feedback button opens a chat-style panel where students can submit comments, ratings, and suggestions from any screen.',
  },
  {
    question: 'Are my submissions and purchases stored safely?',
    answer:
      'Feedback is stored in the database and protected with moderation. Purchases and user data are handled by the backend and persisted securely.',
  },
  {
    question: 'Do I need to pay before I can start learning?',
    answer:
      'Some content is free to explore, and paid subjects or lectures are unlocked after purchase approval. You can get started and browse what is available first.',
  },
  {
    question: 'Can I view lectures on mobile?',
    answer:
      'Yes. The site is responsive and the viewer adapts to smaller screens so learners can continue from desktop or phone.',
  },
  {
    question: 'How long does approval take?',
    answer:
      'It takes up to 24 hours for purchases to be reviewed and approved. ',
  },
];

const FAQSection = () => {
  return (
    <section className="container mx-auto max-w-[72rem] px-4 py-20">
      
        <Card className="border-border/40 bg-background/70 shadow-soft backdrop-blur-xl">
          <CardContent className="p-6 sm:p-8">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-4">Frequently asked questions</h2>
            <p className="mt-3 text-muted-foreground text-center mb-8">
              A few things students usually want to know before joining, browsing content, or sending feedback.
            </p>

            <div className="mt-8 rounded-2xl border border-border/50 bg-white/60 px-4 sm:px-10">
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={faq.question} value={`faq-${index}`}>
                    <AccordionTrigger className="text-left text-base font-medium hover:no-underline">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-7">{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </CardContent>
        </Card>
    </section>
  );
};

export default FAQSection;