import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const faqData = [
  {
    question: "What kind of training programs do you offer?",
    answer: "I offer fully personalized training programs tailored to your specific goals, whether it's muscle gain, fat loss, strength improvement, or contest preparation. Each program is designed based on your experience level, available equipment, and lifestyle."
  },
  {
    question: "How do you track progress?",
    answer: "We track progress through weekly check-ins, which include progress photos, weight measurements, and detailed feedback on your training performance and energy levels. This allows us to make necessary adjustments to your plan to ensure continuous progress."
  },
  {
    question: "Is nutrition coaching included?",
    answer: "Yes, all coaching plans include comprehensive nutrition guidance. I'll provide you with a customized meal plan or flexible dieting guidelines based on your preferences and goals to optimize your results."
  },
  {
    question: "How often can I contact you?",
    answer: "You'll have access to me via WhatsApp for any questions or support you need throughout the week. I aim to respond to all messages within 24 hours."
  },
  {
    question: "Do I need a gym membership?",
    answer: "While a gym membership provides access to a wider range of equipment, I can design effective programs based on the equipment you have available, including home gym setups. We'll discuss this during our initial consultation."
  },
];


const FaqSection = () => {
  return (
    <section id="faq" className="py-20 md:py-32 bg-card">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-headline font-bold text-card-foreground">Frequently Asked Questions</h2>
          <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">Have questions? We have answers. If you don't see your question here, feel free to reach out.</p>
        </div>
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {faqData.map((faq, index) => (
              <AccordionItem value={`item-${index}`} key={index}>
                <AccordionTrigger className="text-lg font-semibold text-left">{faq.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FaqSection;
