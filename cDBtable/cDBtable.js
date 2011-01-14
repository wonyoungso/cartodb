
    // FUNCIONALITIES
    //   - Editing table data with events
    //   - Resize columns
    //   - Pagination with ajax
    //   - Custom style
    //   - jScrollPane
    //   - Update table (remove columns and rows, add columns and rows, move columns, sort columns)
    //   - Validate fields
    //   - Rows selection for multiple edition
    //   - Floating tHead 
    //   - Floating first column 

    
    //Elements out of the plugin (Be careful with this!)
    // - Blue header
    // - div.table_position
    
    // We are playing with these containers but they don't belong to the plugin

    (function( $ ){
      
      var table;
      var loading = false;
      var minPage = 0;
      var maxPage = -1;
      var defaults;
      var actualPage;

      var methods = {
        init : function(options) {
          return this.each(function(){
      
            defaults = {
              getDataUrl: 'http://bioblitz.tdwg.org/api/taxonomy',  
              paginateParam: "page",
              resultsPerPage: 50,
              reuseResults: 500,
              total: 5000
            };
            
            table = $(this)[0];
            methods.getData(defaults, 'next');
            methods.keepSize();
          });
        },
        
        

        getData : function(options, direction) {
         //Pagination AJAX adding rows
         if (direction=="next") {
           maxPage++;
           actualPage = maxPage;
         } else {
           minPage--;
           actualPage = minPage;
         }
         
         $.ajax({
           dataType: 'jsonp',
           method: "GET",
           url: options.getDataUrl,
           data: {
             query: 'a',
             limit: options.resultsPerPage,
             page: actualPage
           },
           success: function(data) {
             if (data.length>0) {
               methods.draw(options,data,direction,actualPage);
             } else {
               if (direction=="next") {
                  maxPage--;
                } else {
                  minPage++;
                }
             }
           }
         });
        },



        draw: function(options,data,direction,page) {
          
          //Draw the data
          if ($(table).html()=='') {
            var thead = '<thead><tr><th class="first"><div></div></th>';
            $.each(data[0], function(index,element){
              thead += '<th width="100"><div><h3>'+index+'</h3><p>String</p><a href="#">options</a></div></th>';
            });
            thead += "</thead></tr>";
            $(table).append(thead);
            
            //Scroll event
            methods.addScroll();
            
            //Cell click event
            methods.bindCellEvent();
            
            //Create elements
            methods.createElements();
          }
          
          
          if ($(table).children('tbody').length==0) {
            var tbody = '<tbody>';
          } else {
            var tbody = '';
          }
          
          
          //Loop all the data
          $.each(data, function(i,element){
            tbody += '<tr><td class="first" r="'+((page*(defaults.resultsPerPage)) + i)+'"><div><a href="#">options</a></div></td>';
            $.each(element, function(j,elem){
              tbody += '<td width="100" r="'+((page*(defaults.resultsPerPage)) + i)+'" c="'+j+'"><div>'+elem+'</div></td>';
            });
            tbody += '</tr>';
          });
          
          if ($(table).children('tbody').length==0) {
            tbody += '</tbody>';
            $(table).append(tbody);
          } else {
            (direction=="previous")?$(table).children('tbody').prepend(tbody):$(table).children('tbody').append(tbody);
          }
          
          methods.checkReuse(direction);
        },
        
        
        checkReuse: function(direction) {
          
          if ((((maxPage - minPage)+1)*defaults.resultsPerPage>defaults.reuseResults)) {
            if (direction=="next") {
                minPage++;
                $(table).children('tbody').children('tr:lt('+defaults.resultsPerPage+')').remove();
            } else {
                maxPage--;
                $(table).children('tbody').children('tr:gt('+(defaults.reuseResults-1)+')').remove();
            }
          }
          
          methods.hideLoader();
        },
        
        
        createElements: function() {
          //Paginate loaders
          $(table).prepend(
          '<div class="loading_previous loading">' +
            '<img src="/images/tables/activity_indicator.gif" alt="Loading..." title="Loading" />'+
            '<p>Loading previous rows...</p>'+
            '<p class="count">Now vizzualizing 50 of X,XXX</p>'+
          '</div>');
        
          $(table).parent().append(
          '<div class="loading_next loading">' +
            '<img src="/images/tables/activity_indicator.gif" alt="Loading..." title="Loading" />'+
            '<p>Loading next rows...</p>'+
            '<p class="count">Now vizzualizing 50 of X,XXX</p>'+
          '</div>');
        },
        
        
        addScroll: function() {
          
          $('div.table_position').scroll(function(ev){
            //For moving first table column
            $(table).children('tbody').children('tr').children('td.first').css('left',$('div.table_position').scrollLeft()+'px');
            $(table).children('thead').children('tr').children('th.first').css('left',$('div.table_position').scrollLeft()+'px');
          });
          
          
          $(window).scroll(function(ev) {
            ev.stopPropagation();
            ev.preventDefault();
            
            //For moving thead when scrolling
            if ($(window).scrollTop()>58) {
              $('section.subheader').css('top',$(window).scrollTop()+'px');
              $(table).children('thead').css('top',$(window).scrollTop()-60+'px');
            } else {
              $('section.subheader').css('top','58px');
              $(table).children('thead').css('top','0px');
            }
            

            //For paginating data
            if (!loading) {
              var difference = $(document).height() - $(window).height();
              if ($(window).scrollTop()==difference) {
                loading = true;
                methods.showLoader('next');
                setTimeout(function(){methods.getData(defaults,'next')},500);
              } else if ($(window).scrollTop()==0 && minPage!=0) {
                loading = true;
                methods.showLoader('previous');
                setTimeout(function(){methods.getData(defaults,'previous')},500);
              }
            }
          });
        },
        
        
        showLoader: function(kind){
          if (minPage==0) {
            var range = (maxPage - minPage + 1)*defaults.resultsPerPage;
          } else {
            var range = minPage*defaults.resultsPerPage+'-'+((maxPage+1)*defaults.resultsPerPage);
          }
          
          if (kind=="previous") {            
            $('div.loading_previous p.count').text('Now vizzualizing '+range+' of '+defaults.total);
            $(table).children('tbody').css('padding','0');
            $('div.loading_previous').show();
          } else {
            $('div.loading_next p.count').text('Now vizzualizing '+range+' of '+defaults.total);
            $('div.loading_next').show();
          }
        },
        
        
        hideLoader: function() {
          loading = false;
          $('div.loading_next').hide();
          $('div.loading_previous').hide();
          $(table).children('tbody').css('padding','53px 0 0 0');
        },
        
        
        bindCellEvent: function() {
          $(document).click(function(event){
            var target = event.target || event.srcElement;
            var targetElement = target.nodeName.toLowerCase();

            if (targetElement == "div" && $(target).parent().attr('r')!=undefined) {
              alert($(target).parent().attr('c')+'-'+$(target).parent().attr('r')+'-'+$(target).parent().text());
            }

            if (event.preventDefault) {
              event.preventDefault();
              event.stopPropagation();
            } else {
              event.stopPropagation();
              event.returnValue = false;
            }
          });
        },
        keepSize: function(){
          //Keep the parent table div with the correct width, onresize window as well
          if ($(window).width() != $('div.table_position').width()) {
            setTimeout(function(){
              resizeTable();
            },500);
          }
          
          $(window).resize(function(ev){
            resizeTable();
          });
          
          function resizeTable() {
            $('div.table_position').width($(window).width());
            var parent_width = $(window).width();
            var width_table_content = (($(table).children('thead').children('tr').children('th').size()-1)*128) + 60;

            if (parent_width>width_table_content) {
              var head_element = $(table).children('thead').children('tr').children('th:last').children('div');
              var body_element = $(table).children('tbody').children('tr');
              
              $(head_element).width(128 + parent_width-width_table_content);
              $(body_element).each(function(index,element){
                $(element).children('td:last').children('div').width(128 + parent_width-width_table_content);
              });
            }
          }
          
        }
      };

      
      $.fn.cDBtable = function(method) {
        if (methods[method]) {
          return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
        } else if ( typeof method === 'object' || ! method ) {
          return methods.init.apply( this, arguments );
        } else {
          return methods.init.apply( this, arguments );
        }
      };
    })( jQuery );