import html2canvas from 'html2canvas';

export const downloadAestheticCard = async (elementId: string, filename: string) => {
    try {
        const element = document.getElementById(elementId);
        if (!element) {
            console.error('Element not found:', elementId);
            return false;
        }

        // We use html2canvas to capture the element.
        // We set scale to 2 for a high-res export (retina display quality).
        const canvas = await html2canvas(element, {
            scale: 2,
            backgroundColor: '#09090b', // match background
            logging: false,
            useCORS: true,
            allowTaint: true
        });

        const image = canvas.toDataURL('image/png', 1.0);
        
        // Trigger download
        const link = document.createElement('a');
        link.download = `${filename}.png`;
        link.href = image;
        link.click();
        
        return true;
    } catch (err) {
        console.error('Failed to capture card:', err);
        return false;
    }
};
